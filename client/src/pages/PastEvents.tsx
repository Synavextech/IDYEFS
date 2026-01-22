import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, MapPin, ChevronDown, Award, Globe, HelpCircle, Bell } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { format, isBefore } from "date-fns";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import HeroSection from "@/components/HeroSection";
import Testimonials from "@/components/Testimonials";
import JoinUs from "@/components/JoinUs";
import { useLocation } from "wouter";

export default function PastEvents() {
    const [location, setLocation] = useLocation();

    // Parse event ID from URL
    const urlEventId = new URLSearchParams(window.location.search).get('id');

    const { data: events, isLoading, error: fetchError } = useQuery({
        queryKey: ["events"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('Event')
                .select('*')
                .order('date', { ascending: false });
            if (error) {
                console.error("[Events] Supabase Fetch Error:", error);
                throw error;
            }
            return data;
        },
        retry: 1
    });

    const { toast } = useToast();

    useEffect(() => {
        if (fetchError) {
            toast({
                title: "Failed to load events",
                description: "There was a problem connecting to the database. Please refresh or check your connection.",
                variant: "destructive"
            });
        }
    }, [fetchError, toast]);

    const pastEvents = useMemo(() => {
        if (!events) return [];
        const now = new Date();
        return events.filter(event => isBefore(new Date(event.date), now));
    }, [events]);

    const selectedEvent = useMemo(() => {
        if (!events || events.length === 0) return null;
        if (urlEventId) {
            const found = events.find((e: any) => e.id === urlEventId);
            if (found) return found;
        }
        // Default to latest past event
        return pastEvents.length > 0 ? pastEvents[0] : null;
    }, [urlEventId, events, pastEvents]);

    if (isLoading) return <div className="flex justify-center py-40"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;

    if (selectedEvent) {
        return (
            <div className="flex flex-col min-h-screen">
                {/* Hero Section */}
                <section className="relative min-h-[80vh] flex items-center pt-20 overflow-hidden bg-slate-900">
                    <div className="absolute inset-0 opacity-40">
                        <div className="grid grid-cols-4 h-full">
                            {selectedEvent.imageUrls?.map((url: string, i: number) => (
                                <img key={url} src={url} className="w-full h-full object-cover grayscale" alt="" />
                            ))}
                        </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

                    <div className="container mx-auto px-4 relative z-10 text-white">
                        <div className="max-w-4xl">
                            <span className="inline-block px-4 py-1.5 rounded-full bg-slate-500/20 backdrop-blur-md border border-slate-500/30 text-slate-300 font-bold mb-6">
                                Past Event Milestone
                            </span>
                            <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight tracking-tighter">
                                {selectedEvent.title}
                            </h1>
                            <p className="text-xl md:text-2xl text-slate-300 mb-10 leading-relaxed max-w-2xl">
                                {selectedEvent.description}
                            </p>
                            <div className="flex flex-wrap gap-6 text-lg">
                                <div className="flex items-center gap-2"><Calendar className="text-primary" /> {format(new Date(selectedEvent.date), 'PPPP')}</div>
                                <div className="flex items-center gap-2"><MapPin className="text-primary" /> {selectedEvent.location}</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Content Sections (Similar to Upcoming but potentially some parts disabled or labeled as retrospective) */}
                <section className="py-24 bg-white dark:bg-slate-950">
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-4xl font-bold mb-8">Event Highlights & Impact</h2>
                        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto">
                            This event brought together youth leaders from across the globe to discuss {selectedEvent.theme || "critical issues"}.
                            Here's a look back at what we achieved.
                        </p>
                    </div>
                </section>

                {/* Show activities if available */}
                {selectedEvent.activities?.length > 0 && (
                    <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
                        <div className="container mx-auto px-4">
                            <h2 className="text-3xl font-bold mb-12 text-center">Looking Back: The Agenda</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {selectedEvent.activities.map((day: any) => (
                                    <div key={day.day} className="bg-white dark:bg-slate-800 p-8 rounded-3xl shadow-sm">
                                        <h3 className="text-xl font-bold mb-4">Day {day.day} - {day.date}</h3>
                                        <ul className="space-y-4">
                                            {day.items?.map((item: any, idx: number) => (
                                                <li key={idx} className="flex gap-4">
                                                    <div className="w-1 h-full bg-slate-200 dark:bg-slate-700 rounded-full" />
                                                    <div>
                                                        <h4 className="font-bold">{item.title}</h4>
                                                        <p className="text-sm text-slate-500">{item.description}</p>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}

                <Testimonials />
                <JoinUs />
            </div>
        );
    }

    return (
        <div className="flex flex-col min-h-screen">
            <HeroSection
                backgroundImageUrl="/images/hero_Events.gif"
                title="Moments Worth Remembering"
                subtitle="Relive the impact and community development across Africa and beyond."
            />

            <section className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-8">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Past Milestone Events</h2>
                            <p className="text-lg text-slate-600">A walk through our history of empowerment.</p>
                        </div>
                    </div>

                    {pastEvents.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {pastEvents.map((event: any) => (
                                <Card key={event.id} className="group flex flex-col h-full border-none shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden bg-slate-50 cursor-pointer" onClick={() => setLocation(`/past-events?id=${event.id}`)}>
                                    <div className="aspect-video relative overflow-hidden">
                                        <img
                                            src={event.imageUrls?.[0] || "/images/event.png"}
                                            alt={event.title}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 grayscale hover:grayscale-0"
                                        />
                                        <div className="absolute top-4 right-4 bg-slate-900/80 text-white px-4 py-1.5 rounded-full font-bold shadow-xl flex items-center gap-2">
                                            <Award className="h-4 w-4 text-primary" /> Completed
                                        </div>
                                    </div>
                                    <CardHeader className="p-8 pb-4">
                                        <CardTitle className="text-2xl font-bold text-slate-900 group-hover:text-primary transition-colors mb-4">{event.title}</CardTitle>
                                        <div className="space-y-3">
                                            <CardDescription className="flex items-center gap-3 text-slate-600">
                                                <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                                    <Calendar className="h-4 w-4" />
                                                </div>
                                                {format(new Date(event.date), 'PPPP')}
                                            </CardDescription>
                                            <CardDescription className="flex items-center gap-3 text-slate-600">
                                                <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                                                    <MapPin className="h-4 w-4" />
                                                </div>
                                                {event.location}
                                            </CardDescription>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-8 py-4 flex-grow">
                                        <p className="text-slate-600 line-clamp-3 leading-relaxed">{event.description}</p>
                                    </CardContent>
                                    <CardFooter className="p-8 pt-4 border-t border-slate-50">
                                        <Button variant="outline" className="w-full">View Event Archive</Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-20 bg-slate-50 rounded-3xl">
                            <Award className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-slate-900 mb-2">No Past Events Found</h3>
                            <p className="text-slate-600">Our journey is just beginning.</p>
                        </div>
                    )}
                </div>
            </section>

            <Testimonials />
            <JoinUs />
        </div>
    );
}
