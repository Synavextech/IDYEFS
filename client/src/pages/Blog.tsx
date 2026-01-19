import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchBlogPosts, fetchAllTestimonials } from '@/services/api';
import PostCard from '@/components/blog/PostCard.tsx';
import PostForm from '@/components/blog/PostForm.tsx';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare, Users } from 'lucide-react';

const Blog: React.FC = () => {
    const { data: postsData, isLoading: postsLoading, isError: postsError } = useQuery({
        queryKey: ['blogPosts'],
        queryFn: fetchBlogPosts
    });

    const { data: testimonialsData, isLoading: testimonialsLoading } = useQuery({
        queryKey: ['testimonials'],
        queryFn: fetchAllTestimonials
    });

    const posts = postsData?.posts || [];
    const testimonials = testimonialsData?.testimonials || [];

    return (
        <div className="container py-20">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2">
                    <h1 className="text-4xl font-bold mb-8">Community Blog & Testimonials</h1>

                    {/* Blog Posts Section */}
                    <div className="mb-12">
                        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                            <MessageSquare className="h-6 w-6" />
                            Latest Posts
                        </h2>
                        <div className="space-y-8">
                            {postsLoading && Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-[200px] w-full" />)}
                            {postsError && <p className="text-red-500">Failed to load posts.</p>}
                            {posts.map((post: any) => <PostCard key={post.id} post={post} />)}
                            {!postsLoading && posts.length === 0 && (
                                <Card>
                                    <CardContent className="pt-6">
                                        <p className="text-center text-muted-foreground">
                                            No blog posts yet. Be the first to share your story!
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>

                    {/* Testimonials Section */}
                    <div>
                        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                            <Users className="h-6 w-6" />
                            Community Testimonials
                        </h2>
                        <div className="space-y-4">
                            {testimonialsLoading && Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-[100px] w-full" />)}
                            {testimonials.map((testimonial: any) => (
                                <Card key={testimonial.id}>
                                    <CardContent className="pt-6">
                                        <p className="text-muted-foreground mb-2">&ldquo;{testimonial.content}&rdquo;</p>
                                        <p className="text-sm font-medium">- {testimonial.author?.name || 'Anonymous'}</p>
                                    </CardContent>
                                </Card>
                            ))}
                            {!testimonialsLoading && testimonials.length === 0 && (
                                <Card>
                                    <CardContent className="pt-6">
                                        <p className="text-center text-muted-foreground">
                                            No testimonials yet. Share your experience with the community!
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>

                <aside className="lg:col-span-1">
                    <PostForm />
                </aside>
            </div>
        </div>
    );
};

export default Blog;
