import { supabase } from "@/lib/supabase";

export const fetchBlogPosts = async () => {
    const { data, error } = await supabase
        .from('BlogPost')
        .select('*')
        .order('createdAt', { ascending: false });
    if (error) throw error;
    return { posts: data || [] };
};

export const fetchAllTestimonials = async () => {
    const { data, error } = await supabase
        .from('Testimonial')
        .select(`
            *,
            author:User(name)
        `)
        .order('createdAt', { ascending: false });
    if (error) throw error;
    return { testimonials: data || [] };
};
// End of file
