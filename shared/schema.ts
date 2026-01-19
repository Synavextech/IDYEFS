import { z } from 'zod';

export const insertEventSchema = z.object({
    title: z.string().min(1, "Title is required"),
    theme: z.string().optional(),
    description: z.string().min(1, "Description is required"),
    date: z.string(),
    location: z.string(),
    price: z.coerce.number().min(0),
    imageUrls: z.array(z.string()).default([]),
    activities: z.array(z.any()).default([]),
    alignment: z.any().default({}),
    features: z.array(z.any()).default([]),
    speakers: z.array(z.any()).default([]),
    journey: z.any().default({}),
    faqs: z.array(z.any()).default([]),
    self_funded_seats: z.number().default(0),
    partially_funded_seats: z.number().default(0),
    fully_funded_seats: z.number().default(0),
});

export type InsertEvent = z.infer<typeof insertEventSchema>;

export interface EventActivity {
    day: number;
    date: string;
    items: {
        time?: string;
        title: string;
        description: string;
    }[];
}

export interface EventSpeaker {
    name: string;
    role: string;
    bio: string;
    imageUrl?: string;
}

export interface EventFAQ {
    question: string;
    answer: string;
}

export interface Event extends InsertEvent {
    id: string;
    activities: EventActivity[];
    speakers: EventSpeaker[];
    faqs: EventFAQ[];
    self_funded_seats: number;
    partially_funded_seats: number;
    fully_funded_seats: number;
}

export interface User {
    id: string;
    email: string;
    name: string;
    role: 'USER' | 'ADMIN';
    createdAt?: string;
    updatedAt?: string;
}

export const insertBlogPostSchema = z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
    imageUrl: z.string().optional(),
    authorId: z.string(),
});

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;

export interface BlogPost extends InsertBlogPost {
    id: string;
    createdAt: string;
    updatedAt: string;
}

export interface VisaInvitation {
    id: string;
    userId: string;
    eventId: string;
    status: 'PENDING' | 'PAID' | 'APPROVED' | 'REJECTED';
    amountPaid: number;
    paymentStatus: 'PENDING' | 'PAID' | 'REFUNDED';
    letterUrl?: string;
    createdAt: string;
    updatedAt: string;
    user?: User;
    event?: Event;
}
