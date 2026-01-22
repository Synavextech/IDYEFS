import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, MapPin, Ticket, ChevronDown, Users, Bell, Info, Globe, HelpCircle, ArrowRight, MessageCircle, CheckCircle, Download } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useState, useMemo, useEffect } from "react";
import { format, isAfter, isToday } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import HeroSection from "@/components/HeroSection";
import Testimonials from "@/components/Testimonials";
import JoinUs from "@/components/JoinUs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useLocation } from "wouter";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { loadStripe } from "@stripe/stripe-js";
import PaymentSelection from "@/components/payments/PaymentSelection";
import { generateTicketPDF } from "@/lib/ticket-generator";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function UpcomingEvents() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [location, setLocation] = useLocation();
    const [bookingEvent, setBookingEvent] = useState<any | null>(null);
    const [bookingCategory, setBookingCategory] = useState<'SELF_FUNDED' | 'PARTIALLY_FUNDED' | 'FULLY_FUNDED'>('SELF_FUNDED');
    const [visaInvitationEvent, setVisaInvitationEvent] = useState<any | null>(null);
    const [paymentModal, setPaymentModal] = useState<{ open: boolean; amount: number; bookingId: string; type: 'event' | 'visa' } | null>(null);
    const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);

    // Countdown state
    const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number } | null>(null);

    // Parse event ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlEventId = urlParams.get('id');
    const paymentStatus = urlParams.get('status');
    const bookingIdFromUrl = urlParams.get('bookingId');

    const { data: events, isLoading, error: fetchError } = useQuery({
        queryKey: ["events"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('Event')
                .select('*')
                .order('date', { ascending: true });
            if (error) {
                console.error("[Events] Supabase Fetch Error:", error);
                throw error;
            }
            return data;
        },
        retry: 1
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

    // Check for successful payment redirect
    useEffect(() => {
        if (paymentStatus === 'success' && bookingIdFromUrl) {
            const searchParams = new URLSearchParams(window.location.search);
            const type = searchParams.get('type') || 'event';
            handleSuccessfulPayment(bookingIdFromUrl, type);
            // Clear status from URL
            const newUrl = window.location.pathname + (urlEventId ? `?id=${urlEventId}` : '');
            window.history.replaceState({}, '', newUrl);
        } else if (paymentStatus === 'cancelled') {
            toast({ title: "Payment Cancelled", description: "Your booking was not completed.", variant: "destructive" });
        }
    }, [paymentStatus, bookingIdFromUrl]);

    async function handleSuccessfulPayment(bookingId: string, type: string = 'event') {
        setIsPaymentProcessing(true);
        try {
            if (type === 'event') {
                const { data: booking, error: bookingError } = await supabase
                    .from('Booking')
                    .update({ status: 'CONFIRMED' })
                    .eq('id', bookingId)
                    .select('*, Event(*)')
                    .single();

                if (bookingError) throw bookingError;

                // Generate and download PDF ticket
                generateTicketPDF({
                    eventTitle: booking.Event.title,
                    eventDate: format(new Date(booking.Event.date), 'PPPP'),
                    eventLocation: booking.Event.location,
                    userName: user?.name || 'Guest',
                    userEmail: user?.email || '',
                    category: booking.category,
                    amountPaid: Number(booking.amountPaid),
                    bookingId: booking.id
                });

                toast({ title: "Booking Confirmed!", description: "Your ticket has been generated and downloaded." });
            } else if (type === 'visa') {
                const { error: visaError } = await supabase
                    .from('VisaInvitation')
                    .update({ status: 'PAID', paymentStatus: 'PAID' })
                    .eq('id', bookingId);

                if (visaError) throw visaError;

                toast({ title: "Visa Request Paid!", description: "Your request is now being processed." });
            }
        } catch (error: any) {
            console.error("Error finalizing booking:", error);
            toast({ title: "Error", description: "Failed to finalize booking. Please contact support.", variant: "destructive" });
        } finally {
            setIsPaymentProcessing(false);
        }
    }

    const upcomingEvents = useMemo(() => {
        if (!events) return [];
        const now = new Date();
        return (events as any[]).filter(event => {
            const eventDate = new Date(event.date);
            return isAfter(eventDate, now) || isToday(eventDate);
        });
    }, [events]);

    const selectedEvent = useMemo(() => {
        if (!urlEventId || !events) return null;
        return events.find((e: any) => e.id === urlEventId);
    }, [urlEventId, events]);

    useEffect(() => {
        if (!selectedEvent) return;

        const timer = setInterval(() => {
            const eventDate = new Date(selectedEvent.date);
            const now = new Date();
            const difference = eventDate.getTime() - now.getTime();

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60)
                });
            } else {
                setTimeLeft(null);
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [selectedEvent]);

    const bookingMutation = useMutation({
        mutationFn: async ({ eventId, category, amount }: { eventId: string, category: string, amount: number }) => {
            if (!user) throw new Error("User not authenticated");
            const { data, error } = await supabase
                .from('Booking')
                .insert({
                    eventId: eventId,
                    userId: user.id,
                    category: category,
                    amountPaid: amount,
                    status: 'PENDING'
                })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            setBookingEvent(null);
            setPaymentModal({
                open: true,
                amount: Number(data.amountPaid),
                bookingId: data.id,
                type: 'event'
            });
        },
        onError: (error: any) => {
            toast({ title: "Booking failed", description: error.message, variant: "destructive" });
        }
    });

    const handleStripePayment = async () => {
        if (!paymentModal) return;
        setIsPaymentProcessing(true);
        try {
            const response = await fetch('/api/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    eventId: selectedEvent?.id || bookingEvent?.id,
                    category: bookingCategory,
                    amount: paymentModal.amount,
                    userId: user?.id,
                    bookingId: paymentModal.bookingId,
                    type: paymentModal.type
                }),
            });
            const session = await response.json();
            if (session.error) throw new Error(session.error);

            if (session.url) {
                window.location.href = session.url;
            } else {
                throw new Error("Stripe session URL is missing");
            }
        } catch (error: any) {
            toast({ title: "Stripe Error", description: error.message, variant: "destructive" });
        } finally {
            setIsPaymentProcessing(false);
        }
    };

    const visaMutation = useMutation({
        mutationFn: async ({ eventId, amount }: { eventId: string, amount: number }) => {
            if (!user) throw new Error("User not authenticated");
            const { data, error } = await supabase
                .from('VisaInvitation')
                .insert({
                    eventId: eventId,
                    userId: user.id,
                    amountPaid: amount,
                    status: 'PENDING',
                    paymentStatus: 'PENDING'
                })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (data) => {
            setVisaInvitationEvent(null);
            setPaymentModal({
                open: true,
                amount: Number(data.amountPaid),
                bookingId: data.id,
                type: 'visa'
            });
        },
        onError: (error: any) => {
            toast({ title: "Request failed", description: error.message, variant: "destructive" });
        }
    });

    if (isLoading) return <div className="flex justify-center py-40"><Loader2 className="animate-spin h-12 w-12 text-primary" /></div>;

    const mainContent = (
        <div className="flex flex-col min-h-screen">
            {selectedEvent ? (
                <div className="flex flex-col min-h-screen">
                    {/* 1. Hero Section */}
                    <section className="relative min-h-[80vh] flex items-center pt-20 overflow-hidden bg-slate-900">
                        <div className="absolute inset-0 opacity-40">
                            <div className="grid grid-cols-4 h-full">
                                {selectedEvent.imageUrls?.map((url: string, i: number) => (
                                    <img key={url} src={url} className="w-full h-full object-cover animate-pulse" style={{ animationDelay: `${i * 0.5}s` }} alt="" />
                                ))}
                            </div>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

                        <div className="container mx-auto px-4 relative z-10 text-white">
                            <div className="max-w-4xl">
                                {selectedEvent.theme && (
                                    <span className="inline-block px-4 py-1.5 rounded-full bg-primary/20 backdrop-blur-md border border-primary/30 text-primary font-bold mb-6">
                                        {selectedEvent.theme}
                                    </span>
                                )}
                                <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight tracking-tighter">
                                    {selectedEvent.title}
                                </h1>
                                <p className="text-xl md:text-2xl text-slate-300 mb-10 leading-relaxed max-w-2xl">
                                    {selectedEvent.description}
                                </p>
                                <div className="flex flex-wrap gap-6 text-lg mb-10">
                                    <div className="flex items-center gap-2"><Calendar className="text-primary" /> {format(new Date(selectedEvent.date), 'PPPP')}</div>
                                    <div className="flex items-center gap-2"><MapPin className="text-primary" /> {selectedEvent.location}</div>
                                </div>

                                {/* Countdown Timer */}
                                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-8 max-w-2xl">
                                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                        <Bell className="text-primary animate-bounce" /> Time To Application Deadline
                                    </h3>
                                    {timeLeft ? (
                                        <div className="grid grid-cols-4 gap-4">
                                            {[
                                                { label: 'Days', value: timeLeft.days },
                                                { label: 'Hrs', value: timeLeft.hours },
                                                { label: 'Min', value: timeLeft.minutes },
                                                { label: 'Sec', value: timeLeft.seconds }
                                            ].map((unit, idx) => (
                                                <div key={idx} className="flex flex-col items-center">
                                                    <span className="text-4xl md:text-5xl font-bold tracking-tighter">{unit.value.toString().padStart(2, '0')}</span>
                                                    <span className="text-xs uppercase tracking-widest text-slate-400 mt-1">{unit.label}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-2xl font-bold text-red-500">Registration Closed</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* 2. Admission Categories & Selection Criteria */}
                    <section className="py-24 bg-white dark:bg-slate-950">
                        <div className="container mx-auto px-4">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                                <div>
                                    <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                                        <span className="w-2 h-10 bg-primary rounded-full" />
                                        Event Admission Categories
                                    </h2>
                                    <div className="space-y-6">
                                        {[
                                            { title: "Self Funded", price: selectedEvent.price, seats: selectedEvent.self_funded_seats, desc: "Standard admission for individual delegates." },
                                            { title: "Partially Funded", price: selectedEvent.price * 0.75, seats: selectedEvent.partially_funded_seats, desc: "Special rate for students and young professionals (75% of total)." },
                                            { title: "Fully Funded", price: selectedEvent.price * 0.5, seats: selectedEvent.fully_funded_seats, desc: "Highly competitive scholarship-based admission (50% of total)." }
                                        ].map((cat, i) => (
                                            <div key={i} className="p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:border-primary/30 transition-all group">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h4 className="font-bold text-xl group-hover:text-primary transition-colors">{cat.title}</h4>
                                                        <p className="text-slate-500 text-sm">{cat.desc}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-2xl font-bold text-primary">${cat.price.toFixed(2)}</span>
                                                        <p className="text-xs text-slate-400 mt-1">{cat.seats} seats remaining</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                                        <span className="w-2 h-10 bg-emerald-500 rounded-full" />
                                        Selection Criteria
                                    </h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { title: "Become a Speaker", icon: MessageCircle, color: "bg-blue-500", desc: "Share your expertise with a global audience." },
                                            { title: "Join as Sponsor", icon: Globe, color: "bg-purple-500", desc: "Support the next generation of leaders." },
                                            { title: "NextGenLeaders", icon: Users, color: "bg-amber-500", desc: "Our premium leadership incubator program." },
                                            { title: "#GlobalYouthForum", icon: Globe, color: "bg-emerald-500", desc: "Become a regional champion for change." }
                                        ].map((item, i) => (
                                            <div key={i} className="p-6 rounded-2xl border border-slate-100 dark:border-slate-800 hover:shadow-lg transition-all">
                                                <div className={`${item.color} w-10 h-10 rounded-xl flex items-center justify-center text-white mb-4`}>
                                                    <item.icon className="h-5 w-5" />
                                                </div>
                                                <h4 className="font-bold mb-2">{item.title}</h4>
                                                <p className="text-slate-500 text-sm leading-relaxed">{item.desc}</p>
                                                <Button variant="link" className="p-0 h-auto mt-4 text-primary font-bold">Apply Now <ArrowRight className="ml-1 h-3 w-3" /></Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-16 p-8 bg-primary/5 rounded-3xl border border-primary/10 flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="flex items-start gap-4">
                                    <div className="bg-primary text-white p-3 rounded-2xl">
                                        <Globe className="h-6 w-6" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold">Visa Invitation Letter</h3>
                                        <p className="text-slate-500 max-w-md">Required for international delegates. Request your official invitation letter managed independently from event booking.</p>
                                    </div>
                                </div>
                                <Button
                                    size="lg"
                                    className="rounded-2xl h-14 px-8 text-lg font-bold"
                                    onClick={() => setVisaInvitationEvent(selectedEvent)}
                                    disabled={!timeLeft}
                                >
                                    {timeLeft ? "Request Visa Letter ($50.00)" : "Registration Closed"}
                                </Button>
                            </div>
                        </div>
                    </section>

                    {/* 3. Activities Section */}
                    {selectedEvent.activities?.length > 0 && (
                        <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
                            <div className="container mx-auto px-4">
                                <h2 className="text-4xl font-bold mb-16 text-center">Event Itinerary</h2>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    {selectedEvent.activities.map((day: any) => (
                                        <div key={day.day} className="space-y-6">
                                            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border-l-4 border-primary">
                                                <h3 className="text-2xl font-bold">Day {day.day}</h3>
                                                <p className="text-primary font-semibold">{day.date}</p>
                                            </div>
                                            <div className="space-y-4">
                                                {day.items?.map((item: any, idx: number) => (
                                                    <div key={idx} className="bg-white dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-primary/30 transition-colors">
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

                    {/* 4. Booking CTA */}
                    <section className="py-20 bg-primary text-white text-center">
                        <div className="container mx-auto px-4">
                            <h2 className="text-3xl md:text-5xl font-bold mb-8">Ready to Join Us?</h2>
                            <div className="flex flex-col gap-8 items-center max-w-4xl mx-auto">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                                    {[
                                        { category: 'SELF_FUNDED', label: 'Self Funded', price: selectedEvent.price, desc: 'Register now to secure your place' },
                                        { category: 'PARTIALLY_FUNDED', label: 'Partially Funded', price: selectedEvent.price * 0.75, desc: 'Secure your 25% discount' },
                                        { category: 'FULLY_FUNDED', label: 'Fully Funded', price: selectedEvent.price * 0.5, desc: 'Apply for 50% scholarship' }
                                    ].map((opt) => (
                                        <Button
                                            key={opt.category}
                                            size="lg"
                                            className="bg-white text-primary hover:bg-slate-50 h-32 flex flex-col items-center justify-center rounded-3xl group relative overflow-hidden"
                                            onClick={() => {
                                                setBookingCategory(opt.category as any);
                                                setBookingEvent(selectedEvent);
                                            }}
                                            disabled={!timeLeft}
                                        >
                                            <span className="text-xl font-bold">{opt.label}</span>
                                            <span className="text-sm font-medium opacity-70 mb-2">{timeLeft ? opt.desc : "Registration Closed"}</span>
                                            <span className="text-2xl font-black">${opt.price.toFixed(2)}</span>
                                            <Ticket className="absolute bottom-2 right-2 h-4 w-4 opacity-10 rotate-12 group-hover:scale-150 transition-transform" />
                                        </Button>
                                    ))}
                                </div>
                                <div className="flex flex-wrap justify-center gap-4">
                                    <Button variant="outline" className="border-white text-white hover:bg-white/10 h-12 rounded-xl">Become a Sponsor & Donate</Button>
                                    <Button variant="outline" className="border-white text-white hover:bg-white/10 h-12 rounded-xl">Join as Speaker</Button>
                                </div>
                            </div>
                            <div className="mt-8 flex justify-center gap-8 text-white/80 font-medium">
                                <span>#GlobalYouthForum</span>
                                <span>#NextGenLeaders</span>
                            </div>
                        </div>
                    </section>

                    {/* 5. Alignment Section */}
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
                                            <Globe className="text-primary" /> Global Priorities
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-400">
                                            This summit is shaped around core objectives of leading international youth frameworks, ensuring high impact and global relevance.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* 6. Key Features */}
                    {selectedEvent.features?.length > 0 && (
                        <section className="py-24 bg-slate-50 dark:bg-slate-900/50">
                            <div className="container mx-auto px-4">
                                <h2 className="text-3xl font-bold mb-12 text-center">Event Highlights</h2>
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

                    {/* 7. Speakers Section */}
                    {selectedEvent.speakers?.length > 0 && (
                        <section className="py-24 bg-white dark:bg-slate-950">
                            <div className="container mx-auto px-4">
                                <div className="text-center max-w-2xl mx-auto mb-16">
                                    <h2 className="text-4xl font-bold mb-4">Featured Speakers</h2>
                                    <p className="text-slate-600 dark:text-slate-400">Hear from global state persons, CEOs, and public intellectuals.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                    {selectedEvent.speakers.map((s: any, idx: number) => (
                                        <div key={idx} className="group relative overflow-hidden rounded-3xl bg-slate-100 dark:bg-slate-900">
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

                    {/* 8. User Journey */}
                    {selectedEvent.journey?.arrival && (
                        <section className="py-24 bg-slate-900 text-white">
                            <div className="container mx-auto px-4">
                                <h2 className="text-4xl font-bold mb-16 text-center">In Preparation for the Event</h2>
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                                    <div className="p-10 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10">
                                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-3"><MapPin className="text-primary" /> Arrival & Logistics</h3>
                                        <p className="text-slate-300 leading-relaxed whitespace-pre-line">{selectedEvent.journey.arrival}</p>
                                    </div>
                                    <div className="p-10 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10">
                                        <h3 className="text-2xl font-bold mb-6 flex items-center gap-3"><Bell className="text-primary" /> What to Expect</h3>
                                        <p className="text-slate-300 leading-relaxed whitespace-pre-line">{selectedEvent.journey.expectations}</p>
                                    </div>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* 9. FAQ Section */}
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

                    <JoinUs />
                </div>
            ) : (
                <div className="flex flex-col min-h-screen">
                    <HeroSection
                        backgroundImageUrl="/images/hero_Events.gif"
                        title="Upcoming Summits & Workshops"
                        subtitle="Secure your spot in our upcoming transformative global gatherings."
                    />

                    <section className="py-24 bg-white">
                        <div className="container mx-auto px-4">
                            <div className="flex flex-col md:flex-row justify-between items-center mb-16 gap-8">
                                <div>
                                    <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">Upcoming Events</h2>
                                    <p className="text-lg text-slate-600">Explore and join our scheduled activities.</p>
                                </div>
                            </div>

                            {upcomingEvents.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                    {upcomingEvents.map((event: any) => (
                                        <Card key={event.id} className="group flex flex-col h-full border-none shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer" onClick={() => setLocation(`/upcoming-events?id=${event.id}`)}>
                                            <div className="aspect-video relative overflow-hidden bg-slate-100">
                                                <img
                                                    src={event.imageUrls?.[0] || "/images/event.png"}
                                                    alt={event.title}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                                <div className="absolute top-4 right-4 bg-primary text-white px-4 py-1.5 rounded-full font-bold shadow-xl">
                                                    ${event.price}
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
                                                <Button
                                                    className="w-full h-12 text-lg font-bold group/btn"
                                                    onClick={(e) => { e.stopPropagation(); setBookingEvent(event); }}
                                                >
                                                    Book Your Spot <Ticket className="ml-2 h-5 w-5 transition-transform group-hover/btn:rotate-12" />
                                                </Button>
                                            </CardFooter>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-slate-50 rounded-3xl">
                                    <Calendar className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">No Upcoming Events</h3>
                                    <p className="text-slate-600">Check back later for new event announcements.</p>
                                </div>
                            )}
                        </div>
                    </section>

                    <Testimonials />
                    <JoinUs />
                </div>
            )}

            {/* Booking Selection Dialog */}
            <Dialog open={!!bookingEvent} onOpenChange={() => setBookingEvent(null)}>
                <DialogContent className="sm:max-w-lg rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold">Confirm Your Booking</DialogTitle>
                    </DialogHeader>
                    {bookingEvent && (
                        <div className="space-y-6 pt-4">
                            <div className="flex gap-4 p-4 bg-slate-50 rounded-2xl">
                                <img src={bookingEvent.imageUrls?.[0] || "/images/event.png"} className="h-20 w-20 rounded-xl object-cover" alt="" />
                                <div>
                                    <h4 className="font-bold text-lg">{bookingEvent.title}</h4>
                                    <p className="text-sm text-slate-500">{format(new Date(bookingEvent.date), 'PP')}</p>
                                    <p className="text-primary font-bold">${bookingEvent.price}</p>
                                </div>
                            </div>
                            <div className="space-y-3 font-medium text-slate-600">
                                <p>Select your registration tier:</p>
                                <div className="grid grid-cols-1 gap-3">
                                    {[
                                        { id: 'SELF_FUNDED', label: 'Self Funded', p: bookingEvent.price },
                                        { id: 'PARTIALLY_FUNDED', label: 'Partially Funded', p: bookingEvent.price * 0.75 },
                                        { id: 'FULLY_FUNDED', label: 'Fully Funded', p: bookingEvent.price * 0.5 }
                                    ].map(tier => (
                                        <div
                                            key={tier.id}
                                            className={`p-4 border rounded-2xl cursor-pointer flex justify-between items-center group transition-all ${bookingCategory === tier.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary'}`}
                                            onClick={() => setBookingCategory(tier.id as any)}
                                        >
                                            <div>
                                                <span className="font-bold text-slate-900">{tier.label}</span>
                                                <p className="text-xs text-slate-500">${tier.p.toFixed(2)}</p>
                                            </div>
                                            {bookingCategory === tier.id && <CheckCircle className="h-5 w-5 text-primary" />}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-4 mt-6">
                                <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setBookingEvent(null)}>Cancel</Button>
                                <Button className="flex-1 h-12 rounded-xl" onClick={() => {
                                    if (!user) {
                                        setLocation(`/auth?redirectTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
                                        return;
                                    }
                                    const price = bookingCategory === 'SELF_FUNDED' ? bookingEvent.price :
                                        bookingCategory === 'PARTIALLY_FUNDED' ? bookingEvent.price * 0.75 :
                                            bookingEvent.price * 0.5;
                                    bookingMutation.mutate({ eventId: bookingEvent.id, category: bookingCategory, amount: price });
                                }} disabled={bookingMutation.isPending}>
                                    {bookingMutation.isPending ? "Starting Booking..." : "Proceed to Payment"}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Visa Invitation Dialog */}
            <Dialog open={!!visaInvitationEvent} onOpenChange={() => setVisaInvitationEvent(null)}>
                <DialogContent className="sm:max-w-md rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-center">Visa Invitation Request</DialogTitle>
                    </DialogHeader>
                    {visaInvitationEvent && (
                        <div className="space-y-6 pt-4">
                            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 text-center">
                                <Globe className="h-12 w-12 text-primary mx-auto mb-4" />
                                <h4 className="font-bold text-lg mb-2">Invitation Letter for {visaInvitationEvent.title}</h4>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    This official letter is required for visa applications at embassies. Processing fee is non-refundable.
                                </p>
                            </div>
                            <div className="flex justify-between items-center p-4 border rounded-2xl">
                                <span className="font-bold">Processing Fee</span>
                                <span className="text-xl font-bold text-primary">$50.00</span>
                            </div>
                            <div className="flex gap-4">
                                <Button variant="outline" className="flex-1 h-12 rounded-xl" onClick={() => setVisaInvitationEvent(null)}>Cancel</Button>
                                <Button className="flex-1 h-12 rounded-xl" onClick={() => {
                                    if (!user) {
                                        setLocation(`/auth?redirectTo=${encodeURIComponent(window.location.pathname + window.location.search)}`);
                                        return;
                                    }
                                    visaMutation.mutate({ eventId: visaInvitationEvent.id, amount: 50 });
                                }} disabled={visaMutation.isPending}>
                                    {visaMutation.isPending ? "Processing..." : "Confirm & Pay"}
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Final Payment Dialog */}
            <Dialog open={!!paymentModal?.open} onOpenChange={() => !isPaymentProcessing && setPaymentModal(null)}>
                <DialogContent className="sm:max-w-md rounded-3xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-center">Secure Payment</DialogTitle>
                    </DialogHeader>
                    {paymentModal && (
                        <div className="space-y-6 pt-2">
                            <PaymentSelection
                                amount={paymentModal.amount}
                                onSelect={(method) => {
                                    if (method === 'stripe') {
                                        handleStripePayment();
                                    }
                                }}
                                isProcessing={isPaymentProcessing}
                            />

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-slate-200"></span></div>
                                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-slate-500">Or Pay with PayPal</span></div>
                            </div>

                            <PayPalButtons
                                style={{ layout: 'vertical', shape: 'pill', label: 'pay' }}
                                createOrder={(data, actions) => {
                                    return actions.order.create({
                                        intent: 'CAPTURE',
                                        purchase_units: [{
                                            amount: {
                                                currency_code: 'USD',
                                                value: paymentModal.amount.toString()
                                            },
                                            custom_id: paymentModal.bookingId
                                        }]
                                    });
                                }}
                                onApprove={async (data, actions) => {
                                    if (actions.order) {
                                        const order = await actions.order.capture();
                                        setPaymentModal(null);
                                        handleSuccessfulPayment(paymentModal.bookingId, paymentModal.type);
                                    }
                                }}
                                onError={(err) => {
                                    toast({ title: "PayPal Error", description: "Payment failed. Please try again.", variant: "destructive" });
                                }}
                            />

                            <Button
                                variant="ghost"
                                className="w-full"
                                onClick={() => setPaymentModal(null)}
                                disabled={isPaymentProcessing}
                            >
                                Cancel & Return
                            </Button>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );

    return (
        <PayPalScriptProvider options={{ clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID }}>
            {mainContent}
        </PayPalScriptProvider>
    );
}