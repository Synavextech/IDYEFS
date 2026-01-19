import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function JoinUs() {
    return (
        <section className="py-20 bg-primary text-white overflow-hidden relative">
            {/* Decorative patterns or subtle gradients can go here */}
            <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-64 h-64 bg-accent/20 rounded-full blur-2xl" />

            <div className="container mx-auto px-4 text-center relative z-10">
                <h2 className="text-3xl md:text-5xl font-bold mb-6">Join the Movement</h2>
                <p>Be part of a global network dedicated to change. Whether you are a student, researcher, or professional, there is a place for you to grow and empower others. </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link href="/auth">
                        <Button size="lg" variant="secondary" className="font-bold px-10 h-14 text-lg shadow-xl hover:scale-105 transition-transform">
                            Get Started Now
                        </Button>
                    </Link>
                    <Link href="/past-events">
                        <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-primary px-10 h-14 text-lg">
                            Learn More
                        </Button>
                    </Link>
                </div>
            </div>
        </section>
    );
}
