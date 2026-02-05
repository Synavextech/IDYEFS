import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";

export default function Testimonials() {
    const testimonials = [
        {
            name: "Sarah Johnson",
            role: "Youth Leader",
            content: "WYC changed my perspective on leadership. The mentorship I received was invaluable for my career growth.",
            gif: "/images/Sarah_Johnson.jpg"
        },
        {
            name: "David Chen",
            role: "Program Associate",
            content: "The community here is so supportive. I've gained practical skills that I use every day in my work.",
            gif: "/images/David_Chen.jpg"
        },
        {
            name: "Elena Rodriguez",
            role: "Student",
            content: "A fantastic platform for meeting like-minded individuals and learning about financial vigilance.",
            gif: "/images/Elena Rodriguez.webp"
        },
        {
            name: "Marco Rossi",
            role: "Staff Mentor",
            content: "I've enjoyed working cooperatively with my team. The synergy and shared vision at WYC make every project impactful.",
            gif: "/images/staff - mentor.png"
        },
        {
            name: "Saif Al-Mansoori",
            role: "Delegation Lead",
            content: "The mission in Ottawa, Canada was incredibly impactful. Our team felt supported and empowered throughout the forum.",
            gif: "/images/event9.jpeg"
        },
        {
            name: "James Wilson",
            role: "Global Partner",
            content: "We highly approve of how our funds were utilized for transparency and youth empowerment. WYC demonstrates true accountability.",
            gif: "/images/partner.jpeg"
        }
    ];

    return (
        <section className="py-20 bg-slate-50 overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">What Our Community Says</h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Real stories from the people whose lives have been impacted by our programs and community.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((t, i) => (
                        <Card key={i} className="border-none shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 overflow-hidden bg-white">
                            <div className="h-48 overflow-hidden relative">
                                <img src={t.gif} alt={t.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
                            </div>
                            <CardContent className="pt-6 pb-8">
                                <Quote className="h-8 w-8 text-primary/20 mb-4" />
                                <p className="text-slate-600 italic mb-6 leading-relaxed">
                                    "{t.content}"
                                </p>
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {t.name[0]}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">{t.name}</h4>
                                        <p className="text-xs text-muted-foreground">{t.role}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
