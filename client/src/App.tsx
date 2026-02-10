import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ProtectedRoute } from "./lib/protected-route";

import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";

import Landing from "@/pages/landing";
import AboutUs from "@/pages/aboutus";
import UpcomingEvents from "@/pages/UpcomingEvents";
import PastEvents from "@/pages/PastEvents";
import Blog from "@/pages/Blog";
import AuthPage from "@/pages/Auth";
import Admin from "@/pages/Admin";
import MyRequests from "@/pages/MyRequests";
import NotFound from "@/pages/not-found";

function Router() {
    return (
        <div className="flex flex-col min-h-screen">
            <NavBar />
            <main className="flex-grow">
                <Switch>
                    <Route path="/" component={Landing} />
                    <Route path="/about" component={AboutUs} />
                    <Route path="/upcoming-events" component={UpcomingEvents} />
                    <Route path="/past-events" component={PastEvents} />
                    <Route path="/blog" component={Blog} />
                    <Route path="/auth" component={AuthPage} />

                    {/* Protected Routes */}
                    <ProtectedRoute path="/admin" component={Admin} requireAdmin={true} />
                    <ProtectedRoute path="/my-requests" component={MyRequests} />

                    <Route component={NotFound} />
                </Switch>
            </main>
            <Footer />
        </div>
    );
}

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                <ThemeProvider>
                    <Router />
                    <Toaster />
                </ThemeProvider>
            </AuthProvider>
        </QueryClientProvider>
    );
}

export default App;
