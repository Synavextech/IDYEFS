import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, X, User, LogOut, LayoutDashboard, Home, Info, Calendar, Crown, MessageSquare, Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/lib/supabase";
import { ChevronDown } from "lucide-react";
import NotificationBell from "./NotificationBell";

export default function NavBar() {
    const { user, profile, logout } = useAuth();
    const { theme, setTheme } = useTheme();
    const [location, setLocation] = useLocation();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]);
    const [pastEvents, setPastEvents] = useState<any[]>([]);
    const [isUpcomingOpen, setIsUpcomingOpen] = useState(false);
    const [isPastOpen, setIsPastOpen] = useState(false);

    useEffect(() => {
        const fetchEvents = async () => {
            const now = new Date().toISOString();

            // Fetch Upcoming
            const { data: upcoming } = await supabase
                .from('Event')
                .select('id, title')
                .gte('date', now)
                .order('date', { ascending: true });
            if (upcoming) setUpcomingEvents(upcoming);

            // Fetch Past
            const { data: past } = await supabase
                .from('Event')
                .select('id, title')
                .lt('date', now)
                .order('date', { ascending: false });
            if (past) setPastEvents(past);
        };
        fetchEvents();
    }, []);

    const navLinks = [
        { href: "/", label: "Home" },
        { href: "/about", label: "About" },
        { href: "/upcoming-events", label: "Upcoming Events", dropdown: "upcoming" },
        { href: "/past-events", label: "Past Events", dropdown: "past" },
        { href: "/blog", label: "Blog" },
    ];

    return (
        <nav className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-foreground group-hover:rotate-12 transition-transform duration-300 shadow-lg shadow-primary/20">
                        <span className="text-xl font-bold">I</span>
                    </div>
                    <span className="text-2xl font-bold tracking-tighter hidden sm:block">IYDEF</span>
                </Link>

                {/* Desktop Nav - Text Based */}
                <div className="hidden md:flex items-center gap-6">
                    {navLinks.map((link) => (
                        <div key={link.href} className="relative group/item">
                            {link.dropdown ? (
                                <div className="flex items-center gap-1 cursor-pointer">
                                    <Link
                                        href={link.href}
                                        className={cn(
                                            "text-sm font-semibold transition-all duration-300 hover:text-primary relative py-2",
                                            (link.href === "/" ? location === "/" : location.startsWith(link.href)) ? "text-primary" : "text-muted-foreground"
                                        )}
                                    >
                                        {link.label}
                                    </Link>
                                    <ChevronDown className="h-4 w-4 text-muted-foreground" />

                                    {/* Dropdown Menu */}
                                    <div className="absolute top-full left-0 mt-1 w-64 bg-background border rounded-xl shadow-xl opacity-0 invisible group-hover/item:opacity-100 group-hover/item:visible transition-all duration-300 py-2">
                                        {(link.dropdown === 'upcoming' ? upcomingEvents : pastEvents).length > 0 ? (
                                            (link.dropdown === 'upcoming' ? upcomingEvents : pastEvents).map(event => (
                                                <Link
                                                    key={event.id}
                                                    href={`${link.href}?id=${event.id}`}
                                                    className="block px-4 py-2 text-sm hover:bg-primary/10 hover:text-primary transition-colors"
                                                >
                                                    {event.title}
                                                </Link>
                                            ))
                                        ) : (
                                            <div className="px-4 py-2 text-sm text-muted-foreground">No events found</div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <Link
                                    href={link.href}
                                    className={cn(
                                        "text-sm font-semibold transition-all duration-300 hover:text-primary relative py-2",
                                        location === link.href ? "text-primary" : "text-muted-foreground"
                                    )}
                                >
                                    {link.label}
                                    {location === link.href && (
                                        <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full transition-all duration-300" />
                                    )}
                                </Link>
                            )}
                        </div>
                    ))}
                </div>

                <div className="hidden md:flex items-center gap-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                        className="rounded-full w-10 h-10"
                    >
                        {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                    </Button>

                    {user && <NotificationBell />}

                    {user ? (
                        <div className="flex items-center gap-2">
                            <Link href="/my-requests">
                                <Button variant="ghost" className="rounded-full px-4 text-sm font-semibold hover:text-primary transition-all duration-300">
                                    My Dashboard
                                </Button>
                            </Link>
                            {profile?.role === 'ADMIN' && (
                                <Link href={location === '/admin' ? '/' : '/admin'}>
                                    <Button variant={location === '/admin' ? "default" : "ghost"} size="icon" className="rounded-full w-10 h-10 shadow-sm">
                                        {location === '/admin' ? <Home className="h-5 w-5" /> : <LayoutDashboard className="h-5 w-5" />}
                                    </Button>
                                </Link>
                            )}
                            <Button variant="outline" size="sm" onClick={() => logout()} className="rounded-full px-4 border-2 hover:bg-destructive hover:text-white transition-colors duration-300">
                                <LogOut className="h-4 w-4 mr-2" /> Logout
                            </Button>
                        </div>
                    ) : (
                        <Link href="/auth">
                            <Button size="sm" className="rounded-full px-6 shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all duration-300 active:scale-95">
                                Join Us
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Mobile Actions */}
                <div className="md:hidden flex items-center gap-2">
                    {user && <NotificationBell />}
                    <button
                        className="p-2"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X /> : <Menu />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            {
                isMenuOpen && (
                    <div className="md:hidden border-t bg-background p-4 animate-in fade-in slide-in-from-top-2">
                        <div className="flex flex-col gap-4">
                            {navLinks.map((link) => (
                                <div key={link.href} className="flex flex-col gap-2">
                                    <Link
                                        href={link.href}
                                        onClick={(e) => {
                                            if (link.dropdown) {
                                                e.preventDefault();
                                                if (link.dropdown === 'upcoming') setIsUpcomingOpen(!isUpcomingOpen);
                                                else setIsPastOpen(!isPastOpen);
                                            } else {
                                                setIsMenuOpen(false);
                                            }
                                        }}
                                        className={cn(
                                            "text-lg font-medium flex items-center justify-between",
                                            (link.href === "/" ? location === "/" : location.startsWith(link.href)) ? "text-primary" : "text-muted-foreground"
                                        )}
                                    >
                                        {link.label}
                                        {link.dropdown && (
                                            <ChevronDown className={cn(
                                                "h-5 w-5 transition-transform",
                                                (link.dropdown === 'upcoming' ? isUpcomingOpen : isPastOpen) && "rotate-180"
                                            )} />
                                        )}
                                    </Link>

                                    {link.dropdown && (link.dropdown === 'upcoming' ? isUpcomingOpen : isPastOpen) && (
                                        <div className="pl-4 flex flex-col gap-3 border-l-2 ml-1">
                                            {(link.dropdown === 'upcoming' ? upcomingEvents : pastEvents).length > 0 ? (
                                                (link.dropdown === 'upcoming' ? upcomingEvents : pastEvents).map(event => (
                                                    <Link
                                                        key={event.id}
                                                        href={`${link.href}?id=${event.id}`}
                                                        onClick={() => setIsMenuOpen(false)}
                                                        className="text-sm text-muted-foreground hover:text-primary"
                                                    >
                                                        {event.title}
                                                    </Link>
                                                ))
                                            ) : (
                                                <span className="text-sm text-muted-foreground">No events</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                            <hr />
                            {user ? (
                                <>
                                    {profile?.role === 'ADMIN' && (
                                        <Link href="/admin" onClick={() => setIsMenuOpen(false)}>Admin Dashboard</Link>
                                    )}
                                    <Link href="/my-requests" onClick={() => setIsMenuOpen(false)}>My Dashboard</Link>
                                    <button
                                        onClick={() => { logout(); setIsMenuOpen(false); }}
                                        className="text-left text-lg font-medium text-red-500"
                                    >
                                        Logout
                                    </button>
                                </>
                            ) : (
                                <Link href="/auth" onClick={() => setIsMenuOpen(false)}>
                                    <Button className="w-full">Sign In</Button>
                                </Link>
                            )}
                        </div>
                    </div>
                )
            }
        </nav >
    );
}
