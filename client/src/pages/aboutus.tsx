import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { Link } from "wouter";
import HeroSection from "@/components/HeroSection";
import Testimonials from "@/components/Testimonials";
import JoinUs from "@/components/JoinUs";
import { useState, useEffect } from "react";
import CountUp from "@/components/CountUp";

const teamMembers = [
    {
        name: "Dr. James Wilson",
        role: "Founder & CEO",
        image: "/images/staff-founder.png",
        bio: "Visionary leader dedicated to global youth empowerment and sustainable development."
    },
    {
        name: "Sarah Jenkins",
        role: "Program Director",
        image: "/images/staff-program_director.png",
        bio: "Expert in designing impactful educational programs for emerging leaders."
    },
    {
        name: "Michael Chen",
        role: "Regional Manager",
        image: "/images/staff--regional manager.png",
        bio: "Coordinating operations across diverse regions to ensure community growth."
    },
    {
        name: "Amina Okoro",
        role: "Chief Mentor",
        image: "/images/staff-mentor1.jpeg",
        bio: "Passionate about guiding the next generation towards professional excellence."
    }
];

const partners = [
    "/images/partner.jpeg",
    "/images/partner1.jpeg",
    "/images/partner2.jpeg",
    "/images/partner3.png",
    "/images/partner4.jpeg",
    "/images/partner5.jpeg",
    "/images/partner6.jpeg",
    "/images/partner7.jpeg",
    "/images/partner8.jpeg",
    "/images/partner9.jpeg",
    "/images/partner10.jpeg",
    "/images/partner11.jpeg"
];

const focusAreas = [
    {
        title: "Personal Development",
        image: "/images/t2.gif",
        content: "We provide comprehensive coaching to help youth discover their unique talents and build self-confidence."
    },
    {
        title: "Leadership Excellence",
        image: "/images/t4.gif",
        content: "Our programs foster the critical thinking and decision-making skills needed for modern leadership."
    },
    {
        title: "Financial Literacy",
        image: "/images/t3.gif",
        content: "Equipping young minds with the tools for financial vigilance and economic independence."
    },
    {
        title: "Business Grants",
        image: "/images/t9.gif",
        content: "We equip young entrepreneurs and startups with the neccessary skills and knowledge to get Businesses Grants to start and grow their Businesses."
    }
];

const eventShuffleImages = [
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

export default function About() {
    const [currentEventIdx, setCurrentEventIdx] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentEventIdx((prev) => (prev + 1) % eventShuffleImages.length);
        }, 3000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="flex flex-col min-h-screen bg-white">
            <HeroSection
                backgroundImageUrl="/images/hero_aboutus.gif"
                title="Our Mission to Empower"
                subtitle="We are dedicated to fostering a new generation of proactive leaders and financially astute individuals across the globe."
            />

            {/* About us Introduction */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <div className="relative group">
                            <div className="absolute -inset-4 bg-primary/10 rounded-3xl blur-2xl group-hover:bg-primary/20 transition-colors" />
                            <img src="/images/event.png" alt="WYC in Action" className="relative rounded-2xl shadow-2xl border border-slate-100" />
                        </div>
                        <div className="space-y-8">
                            <div className="inline-block px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-bold uppercase tracking-wider">Who We Are</div>
                            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 leading-tight">Breaking Barriers, <br /><span className="text-primary">Building Futures</span></h2>
                            <p className="text-xl text-slate-600 leading-relaxed font-light">World Youth Centre (WYC) is a global non-profit organization leveraging technology and community connection to address modern challenges. We empower youths through targeted education, professional training, and high-impact networking opportunities.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Our Impact */}
            <section className="pt-4 bg-white container mx-auto px-4 text-center">
                <h3 className="text-2xl font-bold mb-4 text-slate-900">Our Impact</h3>
                <p className="text-slate-600 leading-relaxed text-center">We are committed to making a positive impact in the lives of youths around the world. Our programs are designed to help young people develop the skills and knowledge they need to succeed in today's world.</p>
                <br />
                <div className="grid grid-cols-3 gap-8 pt-4">
                    <div>
                        <h4 className="text-4xl font-bold text-slate-900 mb-1">
                            <CountUp to={50} suffix="k+" />
                        </h4>
                        <p className="text-sm text-slate-500 uppercase font-bold tracking-widest">Youths Impacted</p>
                    </div>
                    <div>
                        <h4 className="text-4xl font-bold text-slate-900 mb-1">
                            <CountUp to={200} suffix="+" />
                        </h4>
                        <p className="text-sm text-slate-500 uppercase font-bold tracking-widest">Global Partners</p>
                    </div>
                    <div>
                        <h4 className="text-4xl font-bold text-slate-900 mb-1">
                            <CountUp to={50} suffix="+" />
                        </h4>
                        <p className="text-sm text-slate-500 uppercase font-bold tracking-widest">Regions Covered</p>
                    </div>
                </div>
            </section>

            {/* Mission & Vision */}
            <section className="py-24 bg-slate-50 relative overflow-hidden">
                <div className="container mx-auto px-4 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <Card className="p-8 border-none shadow-xl bg-white hover:shadow-2xl transition-all duration-500 group">
                            <CardHeader className="p-0 mb-6">
                                <CardTitle className="text-4xl font-bold text-slate-900 mb-1 text-center">Our Mission</CardTitle>
                            </CardHeader>
                            <p className="text-lg text-slate-600 leading-relaxed">To empower youth across the globe by equipping them with leadership skills and financial literacy. We aim to create a supportive environment where young individuals can develop their potential and contribute meaningfully to their communities' prosperity.</p>
                        </Card>
                        <Card className="p-8 border-none shadow-xl bg-white hover:shadow-2xl transition-all duration-500 group">
                            <CardHeader className="p-0 mb-6">
                                <CardTitle className="text-4xl font-bold text-slate-900 mb-1 text-center">Our Vision</CardTitle>
                            </CardHeader>
                            <p className="text-lg text-slate-600 leading-relaxed">Dedicated to fostering a new generation of proactive leaders and financially astute individuals. Through community-driven seminars and mentorship, we provide the essential tools to navigate the modern world successfully.</p>
                        </Card>
                    </div>
                </div>
            </section>

            {/* Focus Areas */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-4xl font-bold text-slate-900 mb-1 text-center">Our Specialized Focus</h2>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                        {focusAreas.map((area, idx) => (
                            <div key={idx} className="flex flex-col items-center p-8 bg-slate-50 rounded-3xl hover:bg-white hover:shadow-2xl transition-all duration-500 border border-transparent hover:border-slate-100 group">
                                <div className="mb-6 w-24 h-24 flex items-center justify-center bg-white rounded-2xl shadow-inner overflow-hidden">
                                    <img src={area.image} alt={area.title} className="w-16 h-16 object-contain group-hover:scale-110 transition-transform duration-500" />
                                </div>
                                <h3 className="text-2xl font-bold mb-4 text-slate-900">{area.title}</h3>
                                <p className="text-slate-600 leading-relaxed text-center">{area.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Event Shuffle Section */}
            <section className="py-24 bg-slate-900 text-white overflow-hidden">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 gap-5 items-center">
                        <div>
                            <h2 className="text-3xl md:text-5xl font-bold leading-tight">Glimpses of <br /><span className="text-indigo-400">Our Journey</span></h2>
                            <p className="text-xl text-slate-400 font-light">Our previous events were more than just gatherings; they were catalysts for change, networking, and growth. See what our community has accomplished together.</p>
                            <div className="pt-6">
                                <Link href="/past-events">
                                    <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-200">Browse Event Archive</Button>
                                </Link>
                            </div>
                        </div>
                        <div className="relative h-[450px] w-full max-w-lg mx-auto">
                            <div className="absolute inset-0 bg-indigo-500/20 blur-3xl rounded-full" />
                            {eventShuffleImages.map((img, idx) => (
                                <img
                                    key={idx}
                                    src={img}
                                    alt="Past Event"
                                    className={`absolute inset-0 w-full h-full object-cover rounded-3xl shadow-2xl transition-all duration-1000 transform ${idx === currentEventIdx ? 'opacity-100 scale-100 rotate-0' : 'opacity-0 scale-95 -rotate-3'
                                        }`}
                                />
                            ))}
                            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                                {eventShuffleImages.map((_, idx) => (
                                    <div
                                        key={idx}
                                        className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentEventIdx ? 'w-8 bg-white' : 'w-2 bg-white/30'}`}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Team Section */}
            <section className="py-24 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-slate-900 mb-1 text-center">Meet Our Visionaries</h2>
                        <p className="text-lg text-slate-600 leading-relaxed">Our team of dedicated professionals and mentors working tirelessly to empower youth across the globe.</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
                        {teamMembers.map((member, index) => (
                            <div key={index} className="group text-center">
                                <div className="relative w-56 h-56 mx-auto mb-8">
                                    <div className="absolute inset-0 bg-indigo-600 rounded-3xl rotate-6 scale-95 opacity-0 group-hover:opacity-100 transition-all duration-500" />
                                    <img
                                        src={member.image}
                                        alt={member.name}
                                        className="relative w-full h-full object-cover rounded-3xl shadow-lg group-hover:-translate-y-2 group-hover:-translate-x-2 transition-transform duration-500"
                                    />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 group-hover:text-primary transition-colors">{member.name}</h3>
                                <p className="text-primary font-bold uppercase tracking-widest text-xs mb-3">{member.role}</p>
                                <p className="text-sm text-slate-500 leading-relaxed px-4">{member.bio}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Partners Section */}
            <section className="py-24 bg-slate-50 border-y border-slate-100">
                <div className="container mx-auto px-4">
                    <p className="text-center text-slate-500 font-bold uppercase tracking-widest text-sm mb-12">Trusted by global leaders</p>
                    <div className="flex flex-wrap justify-center gap-12 items-center opacity-60 hover:opacity-100 transition-opacity duration-700">
                        {partners.map((partnerImage, index) => (
                            <img
                                key={index}
                                src={partnerImage}
                                alt="Partner"
                                className="h-24 md:h-32 transition-all duration-500"
                            />
                        ))}
                    </div>
                </div>
            </section>

            <Testimonials />
            <JoinUs />
        </div>
    );
}
