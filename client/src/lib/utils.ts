import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export async function apiRequest(
    method: string,
    url: string,
    data?: unknown | undefined,
): Promise<Response> {
    const res = await fetch(url, {
        method,
        headers: {
            "Content-Type": "application/json",
        },
        body: data ? JSON.stringify(data) : undefined,
    });

    if (!res.ok) {
        throw new Error(await res.text());
    }

    return res;
}

export const queryClient = {
    invalidateQueries: ({ queryKey }: { queryKey: any[] }) => {
        // Basic mock for now, will be replaced by actual TanStack Query client if needed
        console.log(`Invalidating queries for key: ${queryKey}`);
    }
};
