import React, { createContext, useContext, ReactNode, useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@shared/schema";

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

            if (i < retries - 1) {
                console.log(`[Auth] Profile not found for ${userId}, retrying in 1s... (Attempt ${i + 1}/${retries})`);
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        console.warn(`[Auth] Profile not found for ${userId} after ${retries} attempts.`);
        return null;
    };

    useEffect(() => {
        const checkSession = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error("[Session] Error checking initial session:", error.message, error);
                    setIsLoading(false);
                    return;
                }

                const currentUser = session?.user ?? null;
                console.log("[Session] Initial session state:", currentUser ? `Logged in as ${currentUser.email}` : "No active session");

                setUser(currentUser);
                if (currentUser) {
                    const p = await fetchProfile(currentUser.id);
                    setProfile(p);
                }
            } catch (err) {
                console.error("[Session] Unexpected error during session check:", err);
            } finally {
                setIsLoading(false);
            }
        };

        checkSession();

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`[Auth] Auth state changed: ${event}`);
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                console.log(`[Auth] User detected: ${currentUser.email}, fetching profile...`);
                // When auth state changes, fetch profile
                const p = await fetchProfile(currentUser.id);
                setProfile(p);
            } else {
                console.log("[Auth] No user detected after state change.");
                setProfile(null);
            }
            setIsLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email: string, password: string) => {
        console.log(`[Auth] Attempting login for ${email}...`);
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            console.error(`[Auth] Login failed for ${email}:`, error.message);
            throw error;
        }
        console.log(`[Auth] Login successful for ${email}`);
        return data;
    };

    const register = async (email: string, password: string, name: string) => {
        console.log(`[Auth] Attempting registration for ${email} with name: ${name}...`);
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { name }
            }
        });
        if (error) {
            console.error(`[Auth] Registration failed for ${email}:`, error.message);
            throw error;
        }
        console.log(`[Auth] Registration request sent for ${email}. session established: ${!!data.session}`);
        return data;
    };

    const logout = async () => {
        console.log("[Auth] Logging out...");
        await supabase.auth.signOut();
        window.location.href = "/";
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
