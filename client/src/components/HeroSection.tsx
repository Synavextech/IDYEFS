import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface HeroSectionProps {
    backgroundImageUrl: string;
    title: string;
    subtitle: string;
    children?: ReactNode;
    className?: string;
}

export default function HeroSection({
    backgroundImageUrl,
    title,
    subtitle,
    children,
    className,
}: HeroSectionProps) {
    return (
        <section
            className={cn("relative w-full min-h-[60vh] flex items-center justify-center overflow-hidden", className)}
        >
            {/* Background with overlay */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-10000 hover:scale-110"
                style={{ backgroundImage: `url(${backgroundImageUrl})` }}
            >
                <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
            </div>

            <div className="relative container mx-auto px-4 text-center z-10 text-white">
                <h1 className="text-4xl md:text-6xl font-extrabold mb-6 animate-in fade-in slide-in-from-bottom-5 duration-700">
                    {title}
                </h1>
                <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90 animate-in fade-in slide-in-from-bottom-6 duration-1000">
                    {subtitle}
                </p>
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                    {children}
                </div>
            </div>
        </section>
    );
}
