import { useState, useCallback } from "react";

export interface Toast {
    id: string;
    title?: string;
    description?: string;
    variant?: "default" | "destructive";
}

export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const toast = useCallback(({ title, description, variant = "default" }: Omit<Toast, "id">) => {
        const id = Math.random().toString(36).substring(2, 9);
        console.log(`[Toast] ${title}: ${description} (${variant})`);
        // In a real app, you'd add this to state and have a Toaster component render it
        return id;
    }, []);

    return { toast, toasts };
}
