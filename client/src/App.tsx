import { Suspense, lazy } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import { Loader2 } from "lucide-react";

// Components
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

// Lazy Pages
const NotFound = lazy(() => import("@/pages/not-found.tsx"));
const Landing = lazy(() => import("@/pages/landing.tsx"));
const About = lazy(() => import("@/pages/aboutus.tsx"));
const Blog = lazy(() => import("@/pages/Blog.tsx"));
const UpcomingEvents = lazy(() => import("@/pages/UpcomingEvents.tsx"));
const PastEvents = lazy(() => import("@/pages/PastEvents.tsx"));
const Admin = lazy(() => import("@/pages/Admin.tsx"));
const AuthPage = lazy(() => import("@/pages/Auth.tsx"));
const MyRequests = lazy(() => import("@/pages/MyRequests.tsx"));

function Router() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
            <Switch>
                <Route path="/" component={Landing} />
                <Route path="/about" component={About} />
                <Route path="/blog" component={Blog} />
                <Route path="/upcoming-events" component={UpcomingEvents} />
                <Route path="/past-events" component={PastEvents} />
                <Route path="/auth" component={AuthPage} />
                <ProtectedRoute path="/admin" component={Admin} requireAdmin />
                <ProtectedRoute path="/my-requests" component={MyRequests} />
                <Route component={NotFound} />
            </Switch>
        </Suspense>
    );
}


import { ThemeProvider } from "@/contexts/ThemeContext";

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <ThemeProvider>
                    <div className="flex min-h-screen flex-col">
                        <NavBar />
                        <main className="flex-1">
                            <Router />
                        </main>
                        <Footer />
                    </div>
                    <Toaster />
                </ThemeProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
}


export default App;
