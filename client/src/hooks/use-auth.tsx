import React, { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@shared/schema";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
    user: any | null; // Supabase User
    profile: User | null; // Database Profile
    isLoading: boolean;
    login: (email: string, password: string) => Promise<{ user: any; session: any } | null>;
    register: (email: string, password: string, name: string) => Promise<{ user: any; session: any } | null>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<any | null>(null);
    const [profile, setProfile] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    const fetchProfile = async (userId: string, retries = 3): Promise<User | null> => {
        for (let i = 0; i < retries; i++) {
            const { data, error } = await supabase
                .from("User")
                .select("*")
                .eq("id", userId)
                .single();

            if (!error && data) {
                return data as User;
            }

            if (error && error.code !== "PGRST116") { // PGRST116 is "no rows returned"
                console.error(`[Auth] Error fetching profile (attempt ${i + 1}):`, error);
            }

            // Exponential backoff
            if (i < retries - 1) {
                const delay = 500 * Math.pow(2, i);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        return null;
    };

    useEffect(() => {
        let mounted = true;

        // Helper to fetch and set profile
        const loadUserAndProfile = async (sessionUser: any) => {
            if (!mounted) return;

            setUser(sessionUser);

            if (sessionUser) {
                // Only fetch profile if we don't have it or if it's a different user
                // However, for simplicity and correctness on login, we fetch it.
                // We can optimize by checking if profile.id === sessionUser.id in a real app, 
                // but here we just want to avoid the "hang" from the event listener race.
                const p = await fetchProfile(sessionUser.id);
                if (mounted) {
                    setProfile(p);
                }
            } else {
                if (mounted) {
                    setProfile(null);
                }
            }
        };

        const initializeAuth = async () => {
            try {
                // Get initial session
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error("[Session] Error checking initial session:", error);
                }

                if (mounted) {
                    const currentUser = session?.user ?? null;
                    await loadUserAndProfile(currentUser);
                }
            } catch (err) {
                console.error("[Session] Unexpected error during initialization:", err);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        initializeAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`[Auth] Auth state changed: ${event}`);

            if (!mounted) return;

            const currentUser = session?.user ?? null;

            // optimize: handle specific events
            if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
                // For sign in/update, we want to ensure profile is loaded/updated
                setUser(currentUser);
                setIsLoading(true);
                await loadUserAndProfile(currentUser);
                if (mounted) setIsLoading(false);
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setProfile(null);
                setIsLoading(false);
                queryClient.clear();
            } else if (event === 'TOKEN_REFRESHED') {
                // FAST PATH: Just update the user/session, do NOT fetch profile or toggle loading
                // This prevents the "hang" on tab switch or generic token refresh
                setUser(currentUser);
            } else if (event === 'INITIAL_SESSION') {
                // Usually handled by initializeAuth, but if it fires late, handle it safely
                // If we are already loading, this might be the first firing.
                // safe to just update state if needed, but often redundant.
                // We'll treat it like a silent update if we already have a user, or a full load if we don't.
                if (!user && currentUser) {
                    await loadUserAndProfile(currentUser);
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const login = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            throw error;
        }
        return data;
    };

    const register = async (email: string, password: string, name: string) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name }
            }
        });
        if (error) {
            throw error;
        }
        return data;
    };

    const logout = async () => {
        try {
            await supabase.auth.signOut();
            toast({ title: "Logged out", description: "You have been successfully logged out." });
            // Navigation handled by auth state change listener or protected routes
        } catch (error: any) {
            console.error("Logout error:", error);
            toast({ title: "Error", description: "Failed to log out completely.", variant: "destructive" });
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
