import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, MapPin, ChevronDown, Users, Bell, Info, Globe, HelpCircle, ArrowRight, MessageCircle } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, isBefore } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import HeroSection from "@/components/HeroSection";
import Testimonials from "@/components/Testimonials";
import JoinUs from "@/components/JoinUs";
import { useLocation } from "wouter";

export default function PastEvents() {
    const { toast } = useToast();
    const [location, setLocation] = useLocation();
    const [currentImageIdx, setCurrentImageIdx] = useState(0);

    // Parse event ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlEventId = urlParams.get('id');

    const { data: events, isLoading: eventsLoading, error: fetchError } = useQuery({
        queryKey: ["events"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('Event')
                .select('*')
                .order('date', { ascending: false }); // Newest past event first
            if (error) {
                console.error("[Events] Supabase Fetch Error:", error);
                throw error;
            }
            return data;
        },
        retry: 1,
    });

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
        return (events as any[]).filter(event => {
            const eventDate = new Date(event.date);
            return isBefore(eventDate, now);
        });
    }, [events]);

    const selectedEvent = useMemo(() => {
        if (!urlEventId || !events) return null;
        return events.find((e: any) => e.id === urlEventId);
    }, [urlEventId, events]);

    // Media Gallery Shuffle Effect
    useEffect(() => {
        if (!selectedEvent?.imageUrls?.length) return;

        const interval = setInterval(() => {
            setCurrentImageIdx(prev => (prev + 1) % selectedEvent.imageUrls.length);
        }, 5000);

        return () => clearInterval(interval);
    }, [selectedEvent?.imageUrls?.length]);

    if (eventsLoading) return <div className="flex justify-center py-40"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;

    return (
        <div className="flex flex-col min-h-screen">
            {selectedEvent ? (
                <div className="flex flex-col min-h-screen">
                    {/* 1. Hero Section */}
                    <section className="relative min-h-[80vh] flex items-center pt-20 overflow-hidden bg-slate-900">
                        <div className="absolute inset-0 opacity-40">
                            <div className="grid grid-cols-4 h-full">
                                {selectedEvent.imageUrls?.map((url: string, i: number) => (
                                    <img key={url} src={url} className="w-full h-full object-cover" style={{ animationDelay: `${i * 0.5}s` }} alt="" />
                                ))}
                            </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

                        <div className="container mx-auto px-4 relative z-10 text-white">
                            <div className="w-full max-w-4xl">
                                {selectedEvent.theme && (
                                    <span className="inline-block px-4 py-1.5 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30 text-primary font-bold mb-6">
                                        {selectedEvent.theme}
                                    </span>
                                )}
                                <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight tracking-tighter">
                                    {selectedEvent.title}
                                </h1>
                                <p className="text-xl md:text-2xl text-slate-300 mb-10 leading-relaxed w-full">
                                    {selectedEvent.description}
                                </p>
                                <div className="flex flex-wrap gap-6 text-lg mb-10">
                                    <div className="flex items-center gap-2"><Calendar className="text-primary" /> {format(new Date(selectedEvent.date), 'PPPP')}</div>
                                    <div className="flex items-center gap-2"><MapPin className="text-primary" /> {selectedEvent.location}</div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 2. Alignment Section (Impact & Vision) */}
                    {selectedEvent.alignment?.title && (
                        <section className="py-24 bg-white dark:bg-slate-950">
                            <div className="container mx-auto px-4">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                                    <div>
                                        <h2 className="text-4xl font-bold mb-8">{selectedEvent.alignment.title}</h2>
                                        <p className="text-xl text-slate-600 dark:text-slate-400 leading-relaxed">
                                            {selectedEvent.alignment.description}
                                        </p>
                                    </div>
                                    <div className="p-10 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                                            <Globe className="text-primary" /> Global Impact
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-400">
                                            This event contributed to key global objectives, fostering dialogue and action among youth leaders worldwide.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* 3. Key Features / Highlights */}
                    {selectedEvent.features?.length > 0 && (
                        <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
                            <div className="container mx-auto px-4">
                                <h2 className="text-3xl font-bold mb-12 text-center">Impact & Highlights</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {selectedEvent.features.map((feature: string, idx: number) => (
                                        <div key={idx} className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 font-bold">
                                                {idx + 1}
                                            </div>
                                            <h4 className="font-bold leading-tight">{feature}</h4>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* 4. Activities Section (Itinerary) */}
                    {selectedEvent.activities?.length > 0 && (
                        <section className="py-24 bg-white dark:bg-slate-950">
                            <div className="container mx-auto px-4">
                                <h2 className="text-4xl font-bold mb-16 text-center">Event Agenda</h2>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    {selectedEvent.activities.map((day: any) => (
                                        <div key={day.day} className="space-y-6">
                                            <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl shadow-sm border-l-4 border-primary">
                                                <h3 className="text-2xl font-bold">Day {day.day}</h3>
                                                <p className="text-primary font-semibold">{day.date}</p>
                                            </div>
                                            <div className="space-y-4">
                                                {day.items?.map((item: any, idx: number) => (
                                                    <div key={idx} className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                        <h4 className="font-bold text-lg mb-2">{item.title}</h4>
                                                        <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{item.description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* 5. Speakers Section */}
                    {selectedEvent.speakers?.length > 0 && (
                        <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
                            <div className="container mx-auto px-4">
                                <div className="text-center max-w-2xl mx-auto mb-16">
                                    <h2 className="text-4xl font-bold mb-4">Distinguished Speakers</h2>
                                    <p className="text-slate-600 dark:text-slate-400">Leaders who shared their insights and expertise.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                    {selectedEvent.speakers.map((s: any, idx: number) => (
                                        <div key={idx} className="group relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="aspect-[3/4] overflow-hidden">
                                                <img
                                                    src={s.imageUrl || "/images/event.png"}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    alt={s.name}
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(s.name)}`;
                                                    }}
                                                />
                                            </div>
                                            <div className="p-8 space-y-2">
                                                <h4 className="text-2xl font-bold">{s.name}</h4>
                                                <p className="text-primary font-bold">{s.role}</p>
                                                <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-3">{s.bio}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* 6. User Journey (Preparation - Retained as context) */}
                    {selectedEvent.journey?.arrival && (
                        <section className="py-24 bg-slate-900 text-white">
                            <div className="container mx-auto px-4">
                                <h2 className="text-4xl font-bold mb-16 text-center">How We Prepared</h2>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    <div className="p-10 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10">
                                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-3"><MapPin className="text-primary" /> Arrival & Logistics</h3>
                                        <p className="text-slate-300 leading-relaxed whitespace-pre-line">{selectedEvent.journey.arrival}</p>
                                    </div>
                                    <div className="p-10 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10">
                                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-3"><Bell className="text-primary" /> What Was Expected</h3>
                                        <p className="text-slate-300 leading-relaxed whitespace-pre-line">{selectedEvent.journey.expectations}</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* 7. Media Gallery Shuffle */}
                    {selectedEvent.imageUrls?.length > 0 && (
                        <section className="py-24 overflow-hidden bg-slate-50 dark:bg-slate-900/40">
                            <div className="container mx-auto px-4">
                                <div className="text-center mb-16">
                                    <h2 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">Event Gallery</h2>
                                    <p className="text-slate-500 text-lg">Moments captured from this transformative event.</p>
                                </div>
                                <div className="max-w-7xl mx-auto aspect-[16/7] relative rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] bg-slate-950 group">
                                    <AnimatePresence mode="wait">
                                        <motion.img
                                            key={currentImageIdx}
                                            src={selectedEvent.imageUrls[currentImageIdx]}
                                            initial={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
                                            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                            exit={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
                                            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                    </AnimatePresence>

                                    {/* Overlay for depth */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />

                                    {/* Progress indicator */}
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                                        {selectedEvent.imageUrls.map((_: any, idx: number) => (
                                            <div
                                                key={idx}
                                                className={`h-1.5 rounded-full transition-all duration-700 ${currentImageIdx === idx ? 'w-10 bg-white' : 'w-2 bg-white/40'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* 8. FAQ Section */}
                    {selectedEvent.faqs?.length > 0 && (
                        <section className="py-24 bg-white dark:bg-slate-950">
                            <div className="container mx-auto px-4">
                                <h2 className="text-4xl font-bold mb-16 text-center">Frequently Asked Questions</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {selectedEvent.faqs.map((faq: any, idx: number) => (
                                        <div key={idx} className="p-8 bg-slate-50 dark:bg-slate-900 rounded-3xl hover:shadow-xl transition-shadow border border-transparent hover:border-primary/20">
                                            <div className="flex items-start gap-3 mb-4">
                                                <HelpCircle className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                                                <h4 className="text-lg font-bold leading-tight">{faq.question}</h4>
                                            </div>
                                            <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">{faq.answer}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>
                    )}

                    <Testimonials />
                    <JoinUs />
                </div>
            ) : (
                <div className="flex flex-col min-h-screen">
                    <HeroSection
                        backgroundImageUrl="/images/hero_Events.gif"
                        title="Past Summits & Workshops"
                        subtitle="Explore our history of transformative global gatherings."
                    />

                    <section className="py-24 bg-white">
                        <div className="container mx-auto px-4">
                            <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-8">
                                <div>
                                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Past Events</h2>
                                    <p className="text-lg text-slate-600">Browse our archive of impactful events.</p>
                                </div>
                            </div>

                            {pastEvents.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                    {pastEvents.map((event: any) => (
                                        <Card key={event.id} className="group flex flex-col h-full border-none shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer" onClick={() => setLocation(`/past-events?id=${event.id}`)}>
                                            <div className="aspect-video relative overflow-hidden bg-slate-100">
                                                <img
                                                    src={event.imageUrls?.[0] || "/images/event.png"}
                                                    alt={event.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
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
                                                <Button
                                                    className="w-full h-12 text-lg font-bold group/btn"
                                                    variant="outline"
                                                    onClick={(e) => { e.stopPropagation(); setLocation(`/past-events?id=${event.id}`); }}
                                                >
                                                    View Details <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover/btn:translate-x-1" />
                                                </Button>
                                            </CardFooter>
                                        </Card>

                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-slate-50 rounded-3xl">
                                    <Calendar className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">No Past Events Found</h3>
                                    <p className="text-slate-600">We are just getting started! Check back soon to see our history.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    <Testimonials />
                    <JoinUs />
                </div>
            )}
        </div>
    );
}
