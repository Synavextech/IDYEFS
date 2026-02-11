import * as React from "react"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import { X, Info, AlertTriangle, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

const Toaster = () => {
    const { toasts, dismiss } = useToast()

    return (
        <div id="toaster" className="fixed top-20 right-4 z-[100] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
            <AnimatePresence mode="popLayout">
                {toasts.map((toast) => (
                    <motion.div
                        key={toast.id}
                        layout
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className={cn(
                            "pointer-events-auto relative group overflow-hidden rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-all",
                            toast.variant === "destructive"
                                ? "bg-red-500/10 border-red-500/20 text-red-600 dark:text-red-400"
                                : "bg-background/80 border-border/50 text-foreground"
                        )}
                    >
                        <div className="flex gap-3">
                            <div className="mt-1 shrink-0">
                                {toast.variant === "destructive" ? (
                                    <AlertTriangle className="h-5 w-5" />
                                ) : (
                                    <CheckCircle2 className="h-5 w-5 text-primary" />
                                )}
                            </div>
                            <div className="flex-1 space-y-1">
                                {toast.title && (
                                    <h3 className="font-bold text-sm leading-none tracking-tight">
                                        {toast.title}
                                    </h3>
                                )}
                                {toast.description && (
                                    <p className="text-xs opacity-90 leading-relaxed">
                                        {toast.description}
                                    </p>
                                )}
                                {toast.action && (
                                    <div className="pt-2">
                                        {toast.action}
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => dismiss(toast.id)}
                                className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded-lg h-fit"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        {/* Progress bar for auto-dismiss (optional) */}
                        <div className="absolute bottom-0 left-0 h-1 bg-primary/20 w-full">
                            <motion.div
                                initial={{ width: "100%" }}
                                animate={{ width: "0%" }}
                                transition={{ duration: 6 }}
                                onAnimationComplete={() => dismiss(toast.id)}
                                className="h-full bg-primary"
                            />
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    )
}

export { Toaster }
