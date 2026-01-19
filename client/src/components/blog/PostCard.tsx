import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

interface PostCardProps {
    post: {
        id: string;
        title: string;
        content: string;
        imageUrl?: string;
        createdAt?: string;
        created_at?: string;
    };
}

export default function PostCard({ post }: PostCardProps) {
    return (
        <Card className="overflow-hidden">
            {post.imageUrl && (
                <img src={post.imageUrl} alt={post.title} className="w-full h-48 object-cover" />
            )}
            <CardHeader>
                <CardTitle>{post.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{format(new Date(post.createdAt || post.created_at || new Date()), 'PPP')}</p>
            </CardHeader>
            <CardContent>
                <p className="whitespace-pre-wrap">{post.content}</p>
            </CardContent>
        </Card>
    );
}
