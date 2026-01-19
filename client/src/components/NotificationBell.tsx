import { useState, useEffect } from "react";
import { Bell, Check, Trash2, Info, AlertTriangle, AlertCircle, Sparkles, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";

interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
}

export default function NotificationBell() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const unreadCount = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        if (!user) return;

        // Fetch initial notifications
        fetchNotifications();

        // Subscribe to real-time changes
        const channel = supabase
            .channel(`user-notifications-${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'Notification',
                    filter: `userId=eq.${user.id}`
                },
                (payload) => {
                    console.log('Notification change received:', payload);
                    if (payload.eventType === 'INSERT') {
                        setNotifications(prev => [payload.new as Notification, ...prev]);
                    } else if (payload.eventType === 'UPDATE') {
                        setNotifications(prev => prev.map(n => n.id === payload.new.id ? payload.new as Notification : n));
                    } else if (payload.eventType === 'DELETE') {
                        setNotifications(prev => prev.filter(n => n.id === payload.old.id));
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    const fetchNotifications = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('Notification')
            .select('*')
            .eq('userId', user.id)
            .order('createdAt', { ascending: false });

        if (error) {
            console.error('Error fetching notifications:', error);
        } else {
            setNotifications(data || []);
        }
    };

    const markAsRead = async (id: string) => {
        const { error } = await supabase
            .from('Notification')
            .update({ isRead: true })
            .eq('id', id);

        if (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        if (!user) return;
        const { error } = await supabase
            .from('Notification')
            .update({ isRead: true })
            .eq('userId', user.id)
            .eq('isRead', false);

        if (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    const deleteNotification = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const { error } = await supabase
            .from('Notification')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting notification:', error);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'INFO': return <Info className="h-4 w-4 text-blue-500" />;
            case 'WARNING': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
            case 'ERROR': return <AlertCircle className="h-4 w-4 text-red-500" />;
            case 'SUCCESS': return <Check className="h-4 w-4 text-green-500" />;
            case 'WELCOME': return <Sparkles className="h-4 w-4 text-purple-500" />;
            case 'BONUS': return <Sparkles className="h-4 w-4 text-amber-500" />;
            default: return <Bell className="h-4 w-4 text-primary" />;
        }
    };

    if (!user) return null;

    return (
        <div className="relative">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(!isOpen)}
                className="relative rounded-full w-10 h-10 hover:bg-primary/10 transition-colors"
                id="notification-bell-trigger"
            >
                <Bell className={cn("h-5 w-5", unreadCount > 0 && "text-primary")} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground border-2 border-background animate-in zoom-in">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-40 bg-black/5"
                            onClick={() => setIsOpen(false)}
                        />

                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-[calc(100vw-2rem)] sm:w-80 md:w-96 bg-background border rounded-2xl shadow-2xl z-50 overflow-hidden"
                        >
                            <div className="p-4 border-b flex items-center justify-between bg-muted/30">
                                <div>
                                    <h3 className="font-bold text-sm">Notifications</h3>
                                    <p className="text-[10px] text-muted-foreground">{unreadCount} unread</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-[10px] text-primary hover:underline font-medium"
                                        >
                                            Mark all as read
                                        </button>
                                    )}
                                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={() => setIsOpen(false)}>
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>

                            <div className="max-h-[60vh] overflow-y-auto scrollbar-hide">
                                {notifications.length > 0 ? (
                                    <div className="divide-y divide-border/50">
                                        {notifications.map((notification) => (
                                            <div
                                                key={notification.id}
                                                onClick={() => !notification.isRead && markAsRead(notification.id)}
                                                className={cn(
                                                    "p-4 transition-all duration-200 group relative cursor-pointer",
                                                    !notification.isRead ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/50"
                                                )}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={cn(
                                                        "mt-1 shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                                                        !notification.isRead ? "bg-primary/10" : "bg-muted"
                                                    )}>
                                                        {getIcon(notification.type)}
                                                    </div>
                                                    <div className="flex-1 space-y-1 pr-6">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <p className={cn("text-xs font-semibold leading-tight", !notification.isRead ? "text-foreground" : "text-muted-foreground")}>
                                                                {notification.title}
                                                            </p>
                                                            <span className="text-[9px] text-muted-foreground whitespace-nowrap">
                                                                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-muted-foreground leading-normal line-clamp-2">
                                                            {notification.message}
                                                        </p>
                                                    </div>
                                                </div>

                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-2 top-4 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={(e) => deleteNotification(notification.id, e)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>

                                                {!notification.isRead && (
                                                    <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-full" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-10 text-center">
                                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Bell className="h-6 w-6 text-muted-foreground/40" />
                                        </div>
                                        <p className="font-medium text-muted-foreground text-xs">All caught up!</p>
                                        <p className="text-[10px] text-muted-foreground/60 mt-1">No new notifications here.</p>
                                    </div>
                                )}
                            </div>

                            <div className="p-2 border-t bg-muted/5 text-center">
                                <Button variant="link" size="sm" className="h-6 text-[10px] text-muted-foreground hover:text-primary">
                                    View notification settings
                                </Button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
