import { useEffect } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight } from "lucide-react";
import { format, isAfter, isToday } from "date-fns";

export default function FirstVisitNotification() {
    const { toast } = useToast();
    const [location, setLocation] = useLocation();

    useEffect(() => {
        const checkFirstVisit = async () => {
            const today = format(new Date(), "yyyy-MM-dd");
            const lastVisit = localStorage.getItem("lastVisitDate");

            if (lastVisit === today) {
                return;
            }

            // If it's a new day, fetch the closest event
            try {
                const { data: events, error } = await supabase
                    .from("Event")
                    .select("*")
                    .gte("date", new Date().toISOString())
                    .order("date", { ascending: true })
                    .limit(1);

                if (error) throw error;

                if (events && events.length > 0) {
                    const event = events[0];

                    // Update last visit date
                    localStorage.setItem("lastVisitDate", today);

                    // Trigger toast
                    toast({
                        title: "Exclusive Event Opportunity! 🚀",
                        description: `Don't miss out on "${event.title}" happening on ${format(new Date(event.date), "PPP")}. Applications are still open!`,
                        action: (
                            <Button
                                size="sm"
                                className="w-full mt-2 rounded-xl group font-bold shadow-lg shadow-primary/20"
                                onClick={() => setLocation(`/upcoming-events?id=${event.id}`)}
                            >
                                Apply Now
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        )
                    });
                }
            } catch (err) {
                console.error("Error checking first visit:", err);
            }
        };

        // Delay slightly for better UX
        const timer = setTimeout(() => {
            checkFirstVisit();
        }, 2000);

        return () => clearTimeout(timer);
    }, [toast, setLocation]);

    return null;
}
