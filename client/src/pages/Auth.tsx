import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function AuthPage() {
    const { user, login, register, isLoading: authLoading } = useAuth();
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const [isLogin, setIsLogin] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const urlParams = new URLSearchParams(window.location.search);
    const redirectTo = urlParams.get("redirectTo") || "/";

    useEffect(() => {
        if (user) {
            console.log(`[AuthPage] User detected, redirecting to: ${redirectTo}`);
            setLocation(redirectTo);
        }
    }, [user, redirectTo, setLocation]);

    if (user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const name = formData.get("name") as string;

        try {
            if (isLogin) {
                await login(email, password);
                toast({
                    title: "Welcome back!",
                    description: "You have successfully signed in.",
                });
            } else {
                const data = await register(email, password, name);
                if (data?.session) {
                    toast({
                        title: "Registration successful!",
                        description: "Your account has been created and you are now signed in.",
                    });
                } else {
                    toast({
                        title: "Registration successful!",
                        description: "Please check your email to confirm your account before signing in.",
                    });
                    setIsLogin(true); // Switch to login after registration if no auto-session
                }
            }
        } catch (error: any) {
            toast({
                title: "Authentication Error",
                description: error.message || "Something went wrong. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-[90vh] flex items-center justify-center bg-slate-50 p-4 pt-20">
            <Card className="w-full max-w-md shadow-2xl border-none rounded-3xl overflow-hidden">
                <div className="h-32 bg-primary flex flex-col items-center justify-center p-8 text-white">
                    <h2 className="text-3xl font-bold tracking-tighter">WYC</h2>
                    <p className="text-xs opacity-80 uppercase tracking-widest mt-1">World Youth Centre</p>
                </div>
                <CardHeader className="text-center pt-8">
                    <CardTitle className="text-2xl font-bold">
                        {isLogin ? "Welcome Back" : "Join the Foundation"}
                    </CardTitle>
                    <CardDescription>
                        {isLogin ? "Sign in to your account to continue" : "Create an account to start your journey with us"}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-8 pt-0">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLogin && (
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <Input id="name" name="name" placeholder="John Doe" required />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="m@example.com" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>
                        <Button type="submit" className="w-full h-12 text-lg font-bold mt-2" disabled={isSubmitting || authLoading}>
                            {isSubmitting ? (
                                <span className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Processing...
                                </span>
                            ) : isLogin ? "Sign In" : "Register"}
                        </Button>
                    </form>
                    <div className="mt-6 text-center text-sm text-slate-500">
                        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                        <button
                            className="text-primary font-bold hover:underline"
                            onClick={() => setIsLogin(!isLogin)}
                        >
                            {isLogin ? "Register now" : "Sign in"}
                        </button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
