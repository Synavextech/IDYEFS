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
        // Channel for cross-tab auth coordination
        const authChannel = new BroadcastChannel('auth_sync');

        // Helper to fetch and set profile
        const loadUserAndProfile = async (sessionUser: any) => {
            if (!mounted) return;

            setUser(sessionUser);

            if (sessionUser) {
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

        const syncSessionToCookies = async (session: any) => {
            if (session?.access_token && session?.refresh_token) {
                try {
                    await fetch('/api/auth/set-session', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            access_token: session.access_token,
                            refresh_token: session.refresh_token
                        })
                    });
                } catch (err) {
                    console.error("[Auth] Failed to sync session to cookies:", err);
                }
            }
        };

        const clearCookies = async () => {
            try {
                await fetch('/api/auth/clear-session', { method: 'POST' });
            } catch (err) {
                console.error("[Auth] Failed to clear cookies:", err);
            }
        };

        const initializeAuth = async () => {
            try {
                let { data: { session }, error } = await supabase.auth.getSession();

                if (!session) {
                    console.log("[Auth] No local session, checking cookies...");
                    try {
                        const response = await fetch('/api/auth/get-session');
                        if (response.ok) {
                            const cookieSession = await response.json();
                            const { data, error: refreshError } = await supabase.auth.setSession({
                                access_token: cookieSession.access_token,
                                refresh_token: cookieSession.refresh_token
                            });
                            if (!refreshError && data.session) {
                                session = data.session;
                                console.log("[Auth] Session restored from cookies");
                            }
                        }
                    } catch (err) {
                        console.error("[Auth] Cookie session retrieval failed:", err);
                    }
                }

                if (error) {
                    console.error("[Session] Error checking initial session:", error);
                }

                if (mounted) {
                    const currentUser = session?.user ?? null;
                    await loadUserAndProfile(currentUser);
                    if (session) await syncSessionToCookies(session);
                }
            } catch (err) {
                console.error("[Session] Unexpected error during initialization:", err);
            } finally {
                if (mounted) setIsLoading(false);
            }
        };

        initializeAuth();

        // Handle visibility changes (resume session on window focus/tab switch)
        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'visible') {
                console.log("[Auth] Tab visible, refreshing session...");
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    const currentUser = session.user;
                    if (user?.id !== currentUser.id) {
                        await loadUserAndProfile(currentUser);
                    }
                } else if (user) {
                    // We thought we were logged in, but we aren't
                    setUser(null);
                    setProfile(null);
                }
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Listen for auth events from other tabs
        authChannel.onmessage = (event) => {
            if (event.data.type === 'AUTH_LOGOUT') {
                console.log("[Auth] Received logout from another tab");
                setUser(null);
                setProfile(null);
                queryClient.clear();
            } else if (event.data.type === 'AUTH_LOGIN') {
                console.log("[Auth] Received login from another tab");
                initializeAuth();
            }
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log(`[Auth] Auth state changed: ${event}`);

            if (!mounted) return;

            const currentUser = session?.user ?? null;

            if (event === 'SIGNED_IN') {
                authChannel.postMessage({ type: 'AUTH_LOGIN' });
                if (user?.id === currentUser?.id && profile) {
                    if (session) syncSessionToCookies(session);
                    return;
                }

                if (session) syncSessionToCookies(session);
                setUser(currentUser);

                const needsLoading = !profile;
                if (needsLoading) setIsLoading(true);

                await loadUserAndProfile(currentUser);

                if (mounted && needsLoading) setIsLoading(false);
            } else if (event === 'USER_UPDATED') {
                if (session) syncSessionToCookies(session);
                setUser(currentUser);
                await loadUserAndProfile(currentUser);
            } else if (event === 'SIGNED_OUT') {
                authChannel.postMessage({ type: 'AUTH_LOGOUT' });
                await clearCookies();
                setUser(null);
                setProfile(null);
                setIsLoading(false);
                queryClient.clear();
            } else if (event === 'TOKEN_REFRESHED') {
                if (session) syncSessionToCookies(session);
                setUser(currentUser);
            } else if (event === 'INITIAL_SESSION') {
                if (session) syncSessionToCookies(session);
                if (!user && currentUser) {
                    await loadUserAndProfile(currentUser);
                }
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            authChannel.close();
        };
    }, [user?.id, profile?.id]);

    const login = async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            let message = error.message;
            if (error.message.includes("Invalid login credentials") || error.status === 400) {
                message = "Invalid email or password. Please check your credentials and try again.";
            } else if (error.message.includes("Email not confirmed")) {
                message = "Please confirm your email address before signing in.";
            }
            throw new Error(message);
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
            let message = error.message;
            if (error.message.includes("User already registered")) {
                message = "An account with this email already exists. Please try signing in instead.";
            } else if (error.message.includes("Password should be")) {
                message = "Password is too weak. Please use at least 6 characters.";
            }
            throw new Error(message);
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
