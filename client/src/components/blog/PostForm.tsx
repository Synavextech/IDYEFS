import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";

export default function PostForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) {
            toast({ title: "Login required", description: "You must be logged in to share a story.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);
        const title = formData.get('title') as string;
        const content = formData.get('content') as string;
        const imageUrl = formData.get('imageUrl') as string;

        const { error } = await supabase.from('BlogPost').insert({
            title,
            content,
            imageUrl,
            authorId: user.id
        });

        if (!error) {
            toast({ title: "Story shared!", description: "Thank you for contributing to our blog." });
            (e.target as HTMLFormElement).reset();
        } else {
            toast({ title: "Error sharing story", description: error.message, variant: "destructive" });
        }
        setIsSubmitting(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Share Your Story</CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input name="title" placeholder="Title" required />
                    <Input name="imageUrl" placeholder="Image URL (optional)" />
                    <textarea
                        name="content"
                        className="w-full min-h-[150px] p-2 border rounded-md focus:ring-2 focus:ring-primary outline-none"
                        placeholder="Share your experience..."
                        required
                    />
                    <Button type="submit" disabled={isSubmitting} className="w-full">
                        Submit Post
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
