import { useState, useCallback, useEffect } from "react";

export interface Toast {
    id: string;
    title?: string;
    description?: string;
    variant?: "default" | "destructive";
    action?: React.ReactNode;
}

const TOAST_LIMIT = 5;

let toastCount = 0;
function genId() {
    toastCount = (toastCount + 1) % Number.MAX_VALUE;
    return toastCount.toString();
}

type Listener = (toasts: Toast[]) => void;
let memoryToasts: Toast[] = [];
const listeners = new Set<Listener>();

const dispatch = (toasts: Toast[]) => {
    memoryToasts = toasts;
    listeners.forEach((listener) => {
        listener(memoryToasts);
    });
};

export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>(memoryToasts);

    useEffect(() => {
        listeners.add(setToasts);
        return () => {
            listeners.delete(setToasts);
        };
    }, []);

    const toast = useCallback(({ title, description, variant = "default", action }: Omit<Toast, "id">) => {
        const id = genId();

        const newToasts = [
            { id, title, description, variant, action },
            ...memoryToasts
        ].slice(0, TOAST_LIMIT);

        dispatch(newToasts);

        return id;
    }, []);

    const dismiss = useCallback((toastId?: string) => {
        if (toastId) {
            dispatch(memoryToasts.filter((t) => t.id !== toastId));
        } else {
            dispatch([]);
        }
    }, []);

    return {
        toast,
        dismiss,
        toasts,
    };
}
