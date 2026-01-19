import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MoveRight, Loader2 } from "lucide-react";
import HeroSection from "@/components/HeroSection";
import EventCard from "@/components/EventCard";
import Testimonials from "@/components/Testimonials";
import JoinUs from "@/components/JoinUs";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const featureData = [
  {
    title: "Networking Opportunities",
    description: "Connect with like-minded individuals and industry leaders to expand your professional network.",
    image: "/images/event1.jpeg"
  },
  {
    title: "Expert Mentorship",
    description: "Get guidance from experienced professionals dedicated to helping you succeed in your journey.",
    image: "/images/event3.jpeg"
  },
  {
    title: "Practical Skill-Building",
    description: "Gain hands-on experience through workshops and real-world projects designed for the modern era.",
    image: "/images/event2.jpeg"
  },
  {
    title: "Community Outreach",
    description: "Participate in programs that make a real difference in communities across the continent.",
    image: "/images/event4.jpeg"
  }
];

const pastEventImages = [
  "/images/event1.jpeg",
  "/images/event2.jpeg",
  "/images/event3.jpeg",
  "/images/event4.jpeg",
  "/images/event5.jpeg",
  "/images/event6.jpeg",
  "/images/event7.jpeg",
  "/images/event8.jpeg",
  "/images/event9.jpeg"
];

export default function Landing() {
  const { data: upcomingEvents, isLoading: loadingUpcoming } = useQuery({
    queryKey: ["upcoming-events"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('Event')
        .select('*')
        .gte('date', now)
        .order('date', { ascending: true })
        .limit(3);
      if (error) throw error;
      return data;
    }
  });

  const { data: pastEvents, isLoading: loadingPast } = useQuery({
    queryKey: ["past-events-landing"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('Event')
        .select('*')
        .lt('date', now)
        .order('date', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    }
  });

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featureData.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <HeroSection
        backgroundImageUrl="/images/hero_landing.gif"
        title="Empowering the Next Generation of Leaders"
        subtitle="Join our community to gain vital leadership skills and achieve financial vigilance for a successful future."
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-700 h-14 px-8 text-lg font-bold shadow-lg shadow-indigo-500/20">
            <Link href="/upcoming-events">
              Explore Events <MoveRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20 h-14 px-8 text-lg font-bold">
            <Link href="/about">Learn More</Link>
          </Button>
        </div>
      </HeroSection>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">Your Path to Empowerment</h2>
            <p className="text-lg text-slate-600">We provide the tools and community you need to succeed in a rapidly changing world.</p>
          </div>
          <div className="relative mx-auto h-[500px] overflow-hidden rounded-3xl group">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <div className="relative w-full h-full">
                  <img
                    src={featureData[currentSlide].image}
                    alt={featureData[currentSlide].title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
                  <div className="absolute bottom-12 left-12 right-12 text-white">
                    <h3 className="text-3xl md:text-5xl font-bold mb-4">{featureData[currentSlide].title}</h3>
                    <p className="text-xl md:text-2xl text-slate-200 max-w-2xl">{featureData[currentSlide].description}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
              {featureData.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentSlide(idx)}
                  className={cn(
                    "w-3 h-3 rounded-full transition-all duration-300",
                    currentSlide === idx ? "bg-white w-8" : "bg-white/40 hover:bg-white/60"
                  )}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Why Our Mission Matters</h2>
              <p className="text-xl text-slate-300 leading-relaxed font-light">We believe that every young person deserves access to quality mentorship, practical skills, and opportunities that will shape their future. Our comprehensive approach combines leadership development with financial literacy to create well-rounded, confident individuals ready to make a positive impact.</p>
              <div className="pt-4">
                <Button asChild variant="outline" className="border-indigo-400 text-indigo-400 hover:bg-indigo-400 hover:text-white transition-all">
                  <Link href="/about">Read Our Full Story</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-indigo-500/20 rounded-3xl blur-3xl" />
              <img
                src="/images/event.png"
                alt="Mission"
                className="relative rounded-2xl shadow-2xl border border-white/10"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">Upcoming Events & Workshops</h2>
              <p className="text-lg text-slate-600">Secure your spot and start your journey with us today.</p>
            </div>
            <Button asChild variant="outline" size="lg" className="border-slate-200 hover:bg-slate-50">
              <Link href="/upcoming-events">View All Events <MoveRight className="ml-2 h-5 w-5" /></Link>
            </Button>
          </div>

          {loadingUpcoming ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
            </div>
          ) : !upcomingEvents || upcomingEvents.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed">
              <p className="text-slate-500 font-medium">No upcoming events scheduled yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {upcomingEvents.map((event: any) => <EventCard key={event.id} event={event} />)}
            </div>
          )}
        </div>
      </section>

      {/* Past Events */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-2xl">
              <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">Past Events & Workshops</h2>
              <p className="text-lg text-slate-600">Explore our past events and workshops.</p>
            </div>
            <Button asChild variant="outline" size="lg" className="border-slate-200 hover:bg-slate-50">
              <Link href="/past-events">
                View All Events <MoveRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>

          {loadingPast ? (
            <div className="flex justify-center py-20">
              <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
            </div>
          ) : !pastEvents || pastEvents.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed">
              <p className="text-slate-500 font-medium">No past events recorded yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pastEvents.map((event: any) => <EventCard key={event.id} event={event} />)}
            </div>
          )}
        </div>
      </section>

      {/* Past Events Gallery */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 mb-4">Past Events Gallery</h2>
            <p className="text-lg text-slate-600">Explore highlights from our previous conferences, workshops, and community outreach programs.</p>
          </div>
          {/* images */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {pastEventImages.map((image, index) => (
              <div key={index} className="group relative overflow-hidden rounded-2xl shadow-md h-72">
                <img
                  src={image}
                  alt={`Past Event ${index + 1}`}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-slate-900/40 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="bg-white/90 backdrop-blur-sm p-3 rounded-full shadow-lg">
                    <MoveRight className="h-6 w-6 text-primary" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Video Section for Past Events */}
          <div className="mt-12 space-y-16">

            <div className="text-center mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Highlight BRICS Youth Energy Summit: How was it?</h2>
              <div className="rounded-3xl overflow-hidden shadow-2xl aspect-video bg-black relative group">
                <iframe
                  src="https://www.youtube.com/embed/PXfGF27XFzI"
                  className="w-full h-full border-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
            <div className="text-center mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center mx-auto">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Highlight of BRICS Youth Energy Summit in Johannesburg</h2>
                <div className="rounded-3xl overflow-hidden shadow-2xl aspect-video bg-black relative group">
                  <iframe
                    src="https://www.youtube.com/embed/efBve9fty5c"
                    className="w-full h-full border-none"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>

              <div className="text-center mx-auto">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-6">Highlight of BRICS Youth Energy Summit - Plenary Room, 3 August 2023</h2>
                <div className="rounded-3xl overflow-hidden shadow-2xl aspect-video bg-black relative group">
                  <iframe
                    src="https://www.youtube.com/embed/2D3AbP8doFk"
                    className="w-full h-full border-none"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <JoinUs />
      <Testimonials />
    </div>
  );
}