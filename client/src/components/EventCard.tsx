import { format } from "date-fns";
import { Calendar, MapPin, MoveRight } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function EventCard({ event }: { event: any }) {
    return (
        <Card className="group overflow-hidden border-slate-200 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
            <div className="aspect-video relative overflow-hidden bg-slate-100">
                <img
                    src={event.imageUrls?.[0] || "/images/event.png"}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-primary shadow-sm">
                    {event.category || "Event"}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <div className="flex items-center gap-2 text-white text-sm">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(event.date), "MMM dd, yyyy")}
                    </div>
                </div>
            </div>

            <CardHeader className="pb-2">
                <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-1">
                    {event.title}
                </CardTitle>
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="line-clamp-1">{event.location}</span>
                </div>
            </CardHeader>

            <CardContent className="pb-6">
                <p className="text-sm text-slate-600 line-clamp-3 leading-relaxed">
                    {event.description}
                </p>
            </CardContent>

            <CardFooter className="pt-0 border-t bg-slate-50/50">
                <div className="flex items-center justify-between w-full py-4">
                    <span className="text-lg font-bold text-primary">${event.price}</span>
                    <Link href={`${new Date(event.date) >= new Date() ? '/upcoming-events' : '/past-events'}?id=${event.id}`}>
                        <Button variant="ghost" size="sm" className="group/btn">
                            Details <MoveRight className="ml-2 h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                        </Button>
                    </Link>
                </div>
            </CardFooter>
        </Card>
    );
}
