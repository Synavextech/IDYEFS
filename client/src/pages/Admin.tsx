
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Plus, Trash2, Edit2, Upload, Image as ImageIcon, CheckCircle, User2 } from "lucide-react";
import { format } from "date-fns";
import { Event, insertEventSchema, VisaInvitation } from "@shared/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { cn } from "@/lib/utils";

function VisaInvitationManager() {
    const [requests, setRequests] = useState<VisaInvitation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        const { data, error } = await supabase
            .from('VisaInvitation')
            .select('*, User(*), Event(*)')
            .order('createdAt', { ascending: false });

        if (!error) setRequests(data || []);
        setIsLoading(false);
    };

    const handleUploadLetter = async (requestId: string, file: File) => {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${requestId}.${fileExt}`;
            const filePath = `visa-letters/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('visa-documents')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('visa-documents')
                .getPublicUrl(filePath);

            const { error: updateError } = await supabase
                .from('VisaInvitation')
                .update({
                    letterUrl: publicUrl,
                    status: 'APPROVED'
                })
                .eq('id', requestId);

            if (updateError) throw updateError;

            toast({ title: "Letter uploaded and request approved!" });
            fetchRequests();
        } catch (error: any) {
            toast({ title: "Upload failed", description: error.message, variant: "destructive" });
        }
    };

    if (isLoading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-primary mb-4">Visa Invitation Requests</h2>
            {requests.length === 0 ? (
                <p className="text-gray-500 italic">No visa requests found.</p>
            ) : (
                <div className="grid gap-4">
                    {requests.map(req => (
                        <Card key={req.id}>
                            <CardContent className="p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="font-bold">{req.user?.name}</h3>
                                        <span className={cn(
                                            "text-[10px] px-2 py-0.5 rounded-full font-bold",
                                            req.status === 'PAID' ? "bg-blue-100 text-blue-700" :
                                                req.status === 'APPROVED' ? "bg-green-100 text-green-700" :
                                                    "bg-gray-100 text-gray-700"
                                        )}>
                                            {req.status}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">{req.user?.email}</p>
                                    <p className="text-xs text-primary font-medium mt-1">Event: {req.event?.title}</p>
                                    <p className="text-[10px] text-gray-400">Date: {format(new Date(req.createdAt), 'PPP')}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {req.letterUrl ? (
                                        <Button variant="outline" size="sm" asChild>
                                            <a href={req.letterUrl} target="_blank" rel="noreferrer">View Letter</a>
                                        </Button>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="file"
                                                className="hidden"
                                                id={`upload-visa-${req.id}`}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleUploadLetter(req.id, file);
                                                }}
                                            />
                                            <Label
                                                htmlFor={`upload-visa-${req.id}`}
                                                className="h-9 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-md cursor-pointer flex items-center text-sm font-medium"
                                            >
                                                <Upload className="h-4 w-4 mr-2" /> Upload Letter
                                            </Label>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}

function BlogManager() {
    const [blogs, setBlogs] = useState<any[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { user } = useAuth();

    useEffect(() => {
        fetchBlogs();
    }, []);

    const fetchBlogs = async () => {
        const { data, error } = await supabase.from('BlogPost').select('*').order('createdAt', { ascending: false });
        if (!error) setBlogs(data || []);
    };

    const onSubmitBlog = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!user) {
            toast({ title: "Session Error", description: "You must be logged in to post.", variant: "destructive" });
            return;
        }
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const title = formData.get('title') as string;
        const content = formData.get('content') as string;
        const imageUrl = formData.get('imageUrl') as string;

        try {
            const { error } = await supabase.from('BlogPost').insert({
                title,
                content,
                imageUrl,
                authorId: user.id
            });
            if (error) throw error;

            toast({ title: "Blog posted!" });
            fetchBlogs();
            (e.target as HTMLFormElement).reset();
        } catch (error: any) {
            console.error("[Blog] Post failed:", error);
            toast({
                title: "Post failed",
                description: error.message || "An unexpected error occurred",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteBlog = async (id: string) => {
        if (!confirm("Delete post?")) return;
        const { error } = await supabase.from('BlogPost').delete().eq('id', id);
        if (!error) {
            toast({ title: "Deleted" });
            fetchBlogs();
        }
    };

    return (
        <>
            <Card className="lg:col-span-1">
                <CardHeader><CardTitle>Create Post</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={onSubmitBlog} className="space-y-4">
                        <Input name="title" placeholder="Title" required />
                        <Input name="imageUrl" placeholder="Image URL (e.g. from Unsplash)" />
                        <Textarea name="content" className="min-h-[200px]" placeholder="Content..." required />
                        <Button type="submit" disabled={isSubmitting} className="w-full">Post Blog</Button>
                    </form>
                </CardContent>
            </Card>
            <div className="lg:col-span-2 space-y-4">
                {blogs.map(blog => (
                    <Card key={blog.id}>
                        <CardContent className="p-4 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold">{blog.title}</h3>
                                <p className="text-sm text-gray-500">{format(new Date(blog.createdAt), 'PPP')}</p>
                            </div>
                            <Button variant="ghost" className="text-red-500" onClick={() => deleteBlog(blog.id)}><Trash2 className="h-4 w-4" /></Button>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </>
    );
}

function ProposalManager() {
    const [proposals, setProposals] = useState<any[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        fetchProposals();
    }, []);

    const fetchProposals = async () => {
        const { data, error } = await supabase
            .from('Proposals')
            .select('*, User(*), Event(*)')
            .order('createdAt', { ascending: false });

        if (error) {
            console.error("Error fetching proposals:", error);
            return;
        }

        // Lazy auto-approval check
        const now = new Date();
        const updates: any[] = [];
        const processedData = data.map(p => {
            if (p.status === 'PENDING' && p.autoApproveAt && new Date(p.autoApproveAt) < now) {
                updates.push(supabase.from('Proposals').update({ status: 'APPROVED' }).eq('id', p.id));
                return { ...p, status: 'APPROVED' };
            }
            return p;
        });

        if (updates.length > 0) {
            await Promise.all(updates);
            toast({ title: "Auto-approved proposals", description: `${updates.length} pending proposals were auto-approved due to time limit.` });
        }

        setProposals(processedData);
    };

    const updateStatus = async (id: string, status: string) => {
        const { error } = await supabase.from('Proposals').update({ status }).eq('id', id);
        if (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Status updated" });
            fetchProposals();
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-primary mb-4">Event Proposals</h2>
            <div className="grid gap-4">
                {proposals.map(p => (
                    <Card key={p.id}>
                        <CardContent className="p-4 flex flex-col md:flex-row justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold">{p.User?.name}</h3>
                                    <span className={cn(
                                        "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                                        p.status === 'APPROVED' ? "bg-green-100 text-green-700" :
                                            p.status === 'REJECTED' ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                                    )}>{p.status}</span>
                                </div>
                                <p className="text-sm text-gray-500 mb-2">{p.User?.email} • Event: {p.Event?.title}</p>
                                <p className="text-sm bg-slate-50 p-2 rounded border">{p.description}</p>
                                {p.documentUrl && (
                                    <a href={p.documentUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline mt-2 block">View Document</a>
                                )}
                            </div>
                            <div className="flex flex-col gap-2 justify-center min-w-[120px]">
                                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus(p.id, 'APPROVED')}>Approve</Button>
                                <Button size="sm" variant="destructive" onClick={() => updateStatus(p.id, 'REJECTED')}>Reject</Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {proposals.length === 0 && <p className="text-slate-500 italic">No proposals found.</p>}
            </div>
        </div>
    );
}

function ApplicationManager() {
    const [applications, setApplications] = useState<any[]>([]);
    const { toast } = useToast();

    useEffect(() => {
        fetchApps();
    }, []);

    const fetchApps = async () => {
        const { data, error } = await supabase
            .from('Applications')
            .select('*, User(*)')
            .order('createdAt', { ascending: false });
        if (!error) setApplications(data || []);
    };

    const updateStatus = async (id: string, status: string) => {
        const { error } = await supabase.from('Applications').update({ status }).eq('id', id);
        if (error) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
            toast({ title: "Status updated" });
            fetchApps();
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold text-primary mb-4">Speaker & Sponsor Applications</h2>
            <div className="grid gap-4">
                {applications.map(app => (
                    <Card key={app.id}>
                        <CardContent className="p-4 flex flex-col md:flex-row justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="font-bold">{app.User?.name}</h3>
                                    <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">{app.type}</span>
                                    <span className={cn(
                                        "text-[10px] px-2 py-0.5 rounded-full font-bold uppercase",
                                        app.status === 'APPROVED' ? "bg-green-100 text-green-700" :
                                            app.status === 'REJECTED' ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"
                                    )}>{app.status}</span>
                                </div>
                                <p className="text-sm text-gray-500 mb-2">{app.User?.email}</p>
                                <p className="text-sm bg-slate-50 p-2 rounded border mb-2">{app.description}</p>
                                <div className="flex gap-4 text-xs text-gray-500">
                                    <span>Donation: <strong>${app.donationAmount}</strong></span>
                                    <span>Payment: <strong className={app.paymentStatus === 'PAID' ? "text-green-600" : "text-yellow-600"}>{app.paymentStatus}</strong></span>
                                </div>
                                {app.documentUrl && (
                                    <a href={app.documentUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline mt-2 block">View Document</a>
                                )}
                            </div>
                            <div className="flex flex-col gap-2 justify-center min-w-[120px]">
                                <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => updateStatus(app.id, 'APPROVED')}>Approve</Button>
                                <Button size="sm" variant="destructive" onClick={() => updateStatus(app.id, 'REJECTED')}>Reject</Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {applications.length === 0 && <p className="text-slate-500 italic">No applications found.</p>}
            </div>
        </div>
    );
}

export default function AdminDashboard() {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [selectedImages, setSelectedImages] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<'events' | 'blogs' | 'visa' | 'proposals' | 'applications'>('events');
    const [editingEvent, setEditingEvent] = useState<Event | null>(null);

    useEffect(() => {
        fetchEvents();
    }, []);

    const fetchEvents = async () => {
        try {
            const { data, error } = await supabase
                .from('Event')
                .select('*')
                .order('createdAt', { ascending: false });

            if (error) throw error;
            setEvents(data || []);
        } catch (error: any) {
            toast({ title: "Error fetching events", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setSelectedImages(prev => [...prev, ...files]);

            const newPreviews = files.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const uploadSingleImage = async (file: File, folder: string = "events"): Promise<string> => {
        console.log(`[Upload] Starting upload for ${file.name} to ${folder}...`);
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${folder}/${fileName}`;

        // Add a 30s timeout to prevent infinite hangs
        const uploadPromise = supabase.storage
            .from('event-media')
            .upload(filePath, file);

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Upload timed out for ${file.name}`)), 30000)
        );

        const { error: uploadError } = await Promise.race([uploadPromise, timeoutPromise]) as any;

        if (uploadError) {
            console.error(`[Upload] Error uploading ${file.name}:`, uploadError);
            throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('event-media')
            .getPublicUrl(filePath);

        console.log(`[Upload] Successfully uploaded ${file.name}. URL: ${publicUrl}`);
        return publicUrl;
    };

    const uploadImages = async (): Promise<string[]> => {
        const urls: string[] = [];
        if (selectedImages.length === 0) {
            console.log("[Upload] No gallery images selected.");
            return [];
        }

        if (selectedImages.length > 10) {
            const msg = "Maximum 10 gallery images allowed.";
            console.warn(`[Upload] ${msg}`);
            toast({ title: "Upload limit", description: msg, variant: "destructive" });
            throw new Error(msg);
        }

        console.log(`[Upload] Starting parallel upload for ${selectedImages.length} gallery images...`);
        setUploading(true);
        try {
            const uploadPromises = selectedImages.map(file => uploadSingleImage(file, "events"));
            const results = await Promise.all(uploadPromises);
            urls.push(...results);
            console.log("[Upload] Parallel batch upload completed successfully.");
        } catch (error: any) {
            console.error("[Upload] Batch upload failed:", error);
            // Even if one fails, we might still have some URLs if we used Promise.allSettled, 
            // but for consistency we fail the whole batch if any single upload fails.
            toast({ title: "Upload failed", description: error.message, variant: "destructive" });
            throw error;
        } finally {
            setUploading(false);
        }
        return urls;
    };

    const [activities, setActivities] = useState<any[]>([]);
    const [speakers, setSpeakers] = useState<any[]>([]);
    const [faqs, setFaqs] = useState<any[]>([]);
    const [features, setFeatures] = useState<string[]>([]);
    const [benefits, setBenefits] = useState<any[]>([]);
    const [alignment, setAlignment] = useState({ title: "", description: "" });
    const [journey, setJourney] = useState({ arrival: "", expectations: "" });

    const handleEditClick = (event: Event) => {
        setEditingEvent(event);
        setActivities(event.activities || []);
        setSpeakers(event.speakers || []);
        setFaqs(event.faqs || []);
        setFeatures(event.features || []);
        setBenefits(event.benefits || []);
        setAlignment(event.alignment || { title: "", description: "" });
        setJourney(event.journey || { arrival: "", expectations: "" });

        // Populate standard form fields
        const form = document.querySelector('form') as HTMLFormElement;
        if (form) {
            const titleInput = form.querySelector('#title') as HTMLInputElement;
            const themeInput = form.querySelector('#theme') as HTMLInputElement;
            const dateInput = form.querySelector('#date') as HTMLInputElement;
            const priceInput = form.querySelector('#price') as HTMLInputElement;
            const locationInput = form.querySelector('#location') as HTMLInputElement;
            const descriptionInput = form.querySelector('#description') as HTMLTextAreaElement;
            const selfFundedInput = form.querySelector('#self_funded_seats') as HTMLInputElement;
            const partiallyFundedInput = form.querySelector('#partially_funded_seats') as HTMLInputElement;
            const fullyFundedInput = form.querySelector('#fully_funded_seats') as HTMLInputElement;

            if (titleInput) titleInput.value = event.title;
            if (themeInput) themeInput.value = event.theme || "";
            if (dateInput) dateInput.value = event.date ? new Date(event.date).toISOString().split('T')[0] : "";
            if (priceInput) priceInput.value = event.price?.toString() || "0";
            if (locationInput) locationInput.value = event.location || "";
            if (descriptionInput) descriptionInput.value = event.description || "";
            if (selfFundedInput) selfFundedInput.value = event.self_funded_seats?.toString() || "0";
            if (partiallyFundedInput) partiallyFundedInput.value = event.partially_funded_seats?.toString() || "0";
            if (fullyFundedInput) fullyFundedInput.value = event.fully_funded_seats?.toString() || "0";
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingEvent(null);
        setActivities([]);
        setSpeakers([]);
        setFaqs([]);
        setFeatures([]);
        setBenefits([]);
        setAlignment({ title: "", description: "" });
        setJourney({ arrival: "", expectations: "" });
        setSelectedImages([]);
        setImagePreviews([]);
        const form = document.querySelector('form') as HTMLFormElement;
        if (form) form.reset();
    };

    const onSubmitEvent = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log("[Submit] Event submission started...");
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        const title = formData.get('title') as string;
        const theme = formData.get('theme') as string;
        const description = formData.get('description') as string;
        const dateStr = formData.get('date') as string;
        const location = formData.get('location') as string;
        const priceStr = formData.get('price') as string;
        const selfFundedSeats = formData.get('self_funded_seats') as string;
        const partiallyFundedSeats = formData.get('partially_funded_seats') as string;
        const fullyFundedSeats = formData.get('fully_funded_seats') as string;

        try {
            console.log("[Submit] Validating form data...");
            if (!dateStr) throw new Error("Please select a date for the event.");

            const eventDate = new Date(dateStr);
            if (isNaN(eventDate.getTime())) throw new Error("Invalid date selected.");

            console.log("[Submit] Processing image uploads...");
            setUploading(true);
            let imageUrls: string[] = [];
            try {
                imageUrls = await uploadImages();
                console.log(`[Submit] Image uploads completed. Count: ${imageUrls.length}`);
            } catch (err: any) {
                console.error("[Submit] Image upload phase failed:", err);
                throw new Error(`Media upload failed: ${err.message}`);
            }

            console.log("[Submit] Processing speaker image uploads...");
            // Upload speaker images
            const speakersWithImages = await Promise.all(speakers.map(async (s, idx) => {
                try {
                    if (s.imageFile) {
                        console.log(`[Submit] Uploading image for speaker ${idx + 1}: ${s.name}`);
                        const url = await uploadSingleImage(s.imageFile, "speakers");
                        const { imageFile, ...rest } = s;
                        return { ...rest, imageUrl: url };
                    }
                    const { imageFile, ...rest } = s;
                    return rest;
                } catch (err: any) {
                    console.error(`[Submit] Speaker ${idx + 1} image upload failed:`, err);
                    throw new Error(`Speaker image upload failed: ${err.message}`);
                }
            }));

            if (editingEvent) {
                console.log("[Submit] Updating event record in Supabase...");
                // Merge images for editing: keep existing if no new ones, or append/replace as logic dictates.
                // For now, we'll keep existing ones and ONLY add new ones if provided.
                const finalImageUrls = imageUrls.length > 0 ? [...(editingEvent.imageUrls || []), ...imageUrls] : (editingEvent.imageUrls || []);

                const { error } = await supabase
                    .from('Event')
                    .update({
                        title,
                        theme,
                        description,
                        date: eventDate.toISOString(),
                        location,
                        price: parseFloat(priceStr) || 0,
                        imageUrls: finalImageUrls,
                        activities,
                        speakers: speakersWithImages,
                        faqs,
                        features,
                        benefits,
                        alignment,
                        journey,
                        self_funded_seats: parseInt(selfFundedSeats) || 0,
                        partially_funded_seats: parseInt(partiallyFundedSeats) || 0,
                        fully_funded_seats: parseInt(fullyFundedSeats) || 0
                    })
                    .eq('id', editingEvent.id);

                if (error) {
                    console.error("[Submit] Supabase Update Error:", error);
                    throw error;
                }
                toast({ title: "Event updated successfully!" });
            } else {
                console.log("[Submit] Inserting event record into Supabase...");
                const { error } = await supabase
                    .from('Event')
                    .insert({
                        title,
                        theme,
                        description,
                        date: eventDate.toISOString(),
                        location,
                        price: parseFloat(priceStr) || 0,
                        imageUrls: imageUrls,
                        activities,
                        speakers: speakersWithImages,
                        faqs,
                        features,
                        benefits,
                        alignment,
                        journey,
                        self_funded_seats: parseInt(selfFundedSeats) || 0,
                        partially_funded_seats: parseInt(partiallyFundedSeats) || 0,
                        fully_funded_seats: parseInt(fullyFundedSeats) || 0
                    });

                if (error) {
                    console.error("[Submit] Supabase Insert Error:", error);
                    throw error;
                }
                toast({ title: "Event created successfully!" });
            }

            console.log("[Submit] Success! Refreshing list...");
            await fetchEvents();

            console.log("[Submit] Resetting form state...");
            (e.target as HTMLFormElement).reset();
            setEditingEvent(null);
            setSelectedImages([]);
            setImagePreviews([]);
            setActivities([]);
            setSpeakers([]);
            setFaqs([]);
            setFeatures([]);
            setBenefits([]);
            setAlignment({ title: "", description: "" });
            setJourney({ arrival: "", expectations: "" });
            console.log("[Submit] Form submission completed successfully.");
        } catch (error: any) {
            console.error("[Submit] Error during event creation:", error);
            toast({
                title: "Error creating event",
                description: error.message || "An unexpected error occurred",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
            setUploading(false);
            console.log("[Submit] isSubmitting and uploading states reset.");
        }
    };

    const deleteEvent = async (id: string) => {
        if (!confirm("Are you sure you want to delete this event?")) return;

        try {
            const { error } = await supabase
                .from('Event')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast({ title: "Event deleted" });
            fetchEvents();
        } catch (error: any) {
            toast({ title: "Error deleting event", description: error.message, variant: "destructive" });
        }
    };

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen"><Loader2 className="animate-spin h-8 w-8" /></div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-primary">Admin Dashboard</h1>
                <div className="flex space-x-2">
                    <Button
                        variant={activeTab === 'events' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('events')}
                    >
                        Events
                    </Button>
                    <Button
                        variant={activeTab === 'blogs' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('blogs')}
                    >
                        Blogs
                    </Button>
                    <Button
                        variant={activeTab === 'visa' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('visa')}
                    >
                        Visa Requests
                    </Button>
                    <Button
                        variant={activeTab === 'proposals' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('proposals')}
                    >
                        Proposals
                    </Button>
                    <Button
                        variant={activeTab === 'applications' ? 'default' : 'outline'}
                        onClick={() => setActiveTab('applications')}
                    >
                        Applications
                    </Button>
                </div>
            </div>

            {activeTab === 'proposals' && <ProposalManager />}
            {activeTab === 'applications' && <ApplicationManager />}


            {activeTab === 'events' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Event Form */}
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle>{editingEvent ? "Edit Event" : "Create New Event"}</CardTitle>
                            <CardDescription>
                                {editingEvent ? `Modifying: ${editingEvent.title}` : "Add a past or upcoming event to the gallery."}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={onSubmitEvent} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="title">Event Title</Label>
                                    <Input id="title" name="title" required placeholder="Global Youth Summit" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="theme">Event Theme</Label>
                                    <Input id="theme" name="theme" placeholder="Climate Action & Sustainability" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="date">Date</Label>
                                        <Input id="date" name="date" type="date" required />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="price">Price ($)</Label>
                                        <Input id="price" name="price" type="number" step="0.01" placeholder="0.00" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="self_funded_seats">Self Funded Seats</Label>
                                        <Input id="self_funded_seats" name="self_funded_seats" type="number" defaultValue="0" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="partially_funded_seats">Partially Funded Seats</Label>
                                        <Input id="partially_funded_seats" name="partially_funded_seats" type="number" defaultValue="0" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="fully_funded_seats">Fully Funded Seats</Label>
                                        <Input id="fully_funded_seats" name="fully_funded_seats" type="number" defaultValue="0" />
                                    </div>
                                </div>

                                <div className="space-y-4 border-t pt-4">
                                    <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Admission Benefits</h3>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setBenefits([...benefits, { category: 'SELF_FUNDED', description: "" }])}>
                                        Add Benefit
                                    </Button>
                                    {benefits.map((b, idx) => (
                                        <Card key={idx} className="p-4 space-y-3 bg-muted/20 border-primary/10">
                                            <div className="flex justify-between items-center gap-2">
                                                <div className="space-y-1 flex-1">
                                                    <label className="text-xs font-semibold text-muted-foreground">Category</label>
                                                    <select
                                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                        value={b.category}
                                                        onChange={e => {
                                                            const newB = [...benefits];
                                                            newB[idx].category = e.target.value;
                                                            setBenefits(newB);
                                                        }}
                                                    >
                                                        <option value="SELF_FUNDED">Self Funded</option>
                                                        <option value="PARTIALLY_FUNDED">Partially Funded</option>
                                                        <option value="FULLY_FUNDED">Fully Funded</option>
                                                    </select>
                                                </div>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setBenefits(benefits.filter((_, i) => i !== idx))} className="text-destructive hover:bg-destructive/10 mt-6">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-xs font-semibold text-muted-foreground">Description</label>
                                                <Input
                                                    placeholder="e.g. Flight + Accommodation included"
                                                    value={b.description}
                                                    className="bg-background"
                                                    onChange={e => {
                                                        const newB = [...benefits];
                                                        newB[idx].description = e.target.value;
                                                        setBenefits(newB);
                                                    }}
                                                />
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="location">Location</Label>
                                    <Input id="location" name="location" placeholder="Nairobi, Kenya" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description" className="text-primary font-semibold">Overview/About</Label>
                                    <Textarea
                                        id="description"
                                        name="description"
                                        required
                                        placeholder="Brief summary of the event..."
                                    />
                                </div>

                                {/* Rich Sections */}
                                <div className="space-y-4 border-t pt-4">
                                    <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Itinerary (Multi-day)</h3>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setActivities([...activities, { day: activities.length + 1, date: "", items: [] }])}>
                                        Add Day
                                    </Button>
                                    {activities.map((day, dIdx) => (
                                        <Card key={dIdx} className="p-4 space-y-3 bg-muted/30 border-primary/20">
                                            <div className="flex justify-between items-center bg-primary/5 p-2 rounded-t-md -mx-4 -mt-4 mb-2">
                                                <Label className="text-primary font-bold">Day {day.day}</Label>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setActivities(activities.filter((_, i) => i !== dIdx))} className="text-destructive hover:bg-destructive/10">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <Input placeholder="Date (e.g. April 2)" value={day.date} className="bg-background" onChange={e => {
                                                const newA = [...activities];
                                                newA[dIdx].date = e.target.value;
                                                setActivities(newA);
                                            }} />
                                            <Button type="button" variant="secondary" size="sm" className="w-full" onClick={() => {
                                                const newA = [...activities];
                                                newA[dIdx].items.push({ title: "", description: "" });
                                                setActivities(newA);
                                            }}>+ Add Activity</Button>
                                            <div className="space-y-3">
                                                {day.items.map((item: any, iIdx: number) => (
                                                    <div key={iIdx} className="pl-4 border-l-2 border-primary/30 space-y-2 mt-2 py-1">
                                                        <Input placeholder="Activity Title" value={item.title} className="bg-background" onChange={e => {
                                                            const newA = [...activities];
                                                            newA[dIdx].items[iIdx].title = e.target.value;
                                                            setActivities(newA);
                                                        }} />
                                                        <Textarea placeholder="Description" className="min-h-[80px] bg-background" value={item.description} onChange={e => {
                                                            const newA = [...activities];
                                                            newA[dIdx].items[iIdx].description = e.target.value;
                                                            setActivities(newA);
                                                        }} />
                                                    </div>
                                                ))}
                                            </div>
                                        </Card>
                                    ))}
                                </div>

                                <div className="space-y-4 border-t pt-4">
                                    <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Speakers</h3>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setSpeakers([...speakers, { name: "", role: "", bio: "", imageUrl: "", imageFile: null }])}>
                                        Add Speaker
                                    </Button>
                                    {speakers.map((s, idx) => (
                                        <Card key={idx} className="p-4 space-y-3 bg-muted/20 border-primary/10">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center space-x-3">
                                                    <div className="relative h-12 w-12 ring-2 ring-primary/20 rounded-full">
                                                        {s.imageFile ? (
                                                            <img src={URL.createObjectURL(s.imageFile)} className="h-full w-full object-cover rounded-full" />
                                                        ) : (
                                                            <div className="h-full w-full bg-primary/5 rounded-full flex items-center justify-center">
                                                                <User2 className="h-6 w-6 text-primary/40" />
                                                            </div>
                                                        )}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            className="hidden"
                                                            id={`speaker-img-${idx}`}
                                                            onChange={e => {
                                                                if (e.target.files?.[0]) {
                                                                    const newS = [...speakers];
                                                                    newS[idx].imageFile = e.target.files[0];
                                                                    setSpeakers(newS);
                                                                }
                                                            }}
                                                        />
                                                        <label htmlFor={`speaker-img-${idx}`} className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full cursor-pointer shadow-sm hover:bg-primary/90 transition-colors">
                                                            <Plus className="h-3 w-3" />
                                                        </label>
                                                    </div>
                                                    <Input placeholder="Speaker Name" value={s.name} className="flex-1 bg-background" onChange={e => {
                                                        const newS = [...speakers];
                                                        newS[idx].name = e.target.value;
                                                        setSpeakers(newS);
                                                    }} />
                                                </div>
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setSpeakers(speakers.filter((_, i) => i !== idx))} className="text-destructive hover:bg-destructive/10">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                            <Input placeholder="Professional Role" value={s.role} className="bg-background" onChange={e => {
                                                const newS = [...speakers];
                                                newS[idx].role = e.target.value;
                                                setSpeakers(newS);
                                            }} />
                                            <Textarea placeholder="Short Bio" className="min-h-[80px] bg-background" value={s.bio} onChange={e => {
                                                const newS = [...speakers];
                                                newS[idx].bio = e.target.value;
                                                setSpeakers(newS);
                                            }} />
                                        </Card>
                                    ))}
                                </div>

                                <div className="space-y-4 border-t pt-4">
                                    <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">FAQs</h3>
                                    <Button type="button" variant="outline" size="sm" onClick={() => setFaqs([...faqs, { question: "", answer: "" }])}>
                                        Add FAQ
                                    </Button>
                                    {faqs.map((f, idx) => (
                                        <Card key={idx} className="p-4 space-y-3 bg-muted/20 border-primary/10">
                                            <div className="flex justify-between items-start gap-2">
                                                <Input placeholder="Question" className="bg-background flex-1" value={f.question} onChange={e => {
                                                    const newF = [...faqs];
                                                    newF[idx].question = e.target.value;
                                                    setFaqs(newF);
                                                }} />
                                                <Button type="button" variant="ghost" size="sm" onClick={() => setFaqs(faqs.filter((_, i) => i !== idx))} className="text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                                            </div>
                                            <Textarea placeholder="Detailed Answer" className="min-h-[80px] bg-background" value={f.answer} onChange={e => {
                                                const newF = [...faqs];
                                                newF[idx].answer = e.target.value;
                                                setFaqs(newF);
                                            }} />
                                        </Card>
                                    ))}
                                </div>
                                <div className="space-y-4 border-t pt-4">
                                    <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">Alignment & Goals</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-primary font-semibold">Affiliation/Vision Title</Label>
                                            <Input placeholder="Aligned with Europe’s Youth Vision" value={alignment.title} className="bg-background" onChange={e => setAlignment({ ...alignment, title: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-primary font-semibold">Affiliation Description</Label>
                                            <Textarea placeholder="Explain how the event aligns with the vision..." className="bg-background min-h-[100px]" value={alignment.description} onChange={e => setAlignment({ ...alignment, description: e.target.value })} />
                                        </div>
                                    </div>
                                    <div className="space-y-2 pt-2">
                                        <Label className="text-primary font-semibold">Key Features/Goals (one per line)</Label>
                                        <Textarea
                                            placeholder="High-Impact Keynotes&#10;Interactive Workshops"
                                            className="min-h-[120px] bg-background"
                                            value={features.join('\n')}
                                            onChange={e => setFeatures(e.target.value.split('\n'))}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4 border-t pt-4">
                                    <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">User Journey</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-primary font-semibold">Arrival & Location Guide</Label>
                                            <Textarea placeholder="How to arrive, shuttle services..." className="bg-background min-h-[100px]" value={journey.arrival} onChange={e => setJourney({ ...journey, arrival: e.target.value })} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-primary font-semibold">What to Expect</Label>
                                            <Textarea placeholder="Event guides, schedules..." className="bg-background min-h-[100px]" value={journey.expectations} onChange={e => setJourney({ ...journey, expectations: e.target.value })} />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2 border-t pt-4">
                                    <Label>Event Media (Gallery)</Label>
                                    <div className="flex items-center space-x-2">
                                        <Input
                                            type="file"
                                            multiple
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="hidden"
                                            id="image-upload"
                                        />
                                        <Label
                                            htmlFor="image-upload"
                                            className="flex items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 transition-colors"
                                        >
                                            <div className="flex flex-col items-center">
                                                <Upload className="h-6 w-6 text-gray-400" />
                                                <span className="text-sm text-gray-500">Click to upload images</span>
                                            </div>
                                        </Label>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 mt-2">
                                        {imagePreviews.map((src, i) => (
                                            <div key={i} className="relative group aspect-square">
                                                <img src={src} className="w-full h-full object-cover rounded-md" />
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(i)}
                                                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button type="submit" className="flex-1" disabled={isSubmitting || uploading}>
                                        {(isSubmitting || uploading) ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                                        {editingEvent ? "Update Event" : "Create Event"}
                                    </Button>
                                    {editingEvent && (
                                        <Button type="button" variant="outline" onClick={cancelEdit}>
                                            Cancel
                                        </Button>
                                    )}
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Events List */}
                    <div className="lg:col-span-2 space-y-4">
                        <h2 className="text-xl font-bold text-primary mb-4">Existing Events</h2>
                        {events.length === 0 ? (
                            <p className="text-gray-500 italic">No events found.</p>
                        ) : (
                            events.map(event => (
                                <Card key={event.id}>
                                    <CardContent className="p-4 flex items-start space-x-4">
                                        {event.imageUrls?.[0] ? (
                                            <img src={event.imageUrls[0]} className="w-24 h-24 object-cover rounded-md flex-shrink-0" />
                                        ) : (
                                            <div className="w-24 h-24 bg-slate-100 flex items-center justify-center rounded-md flex-shrink-0">
                                                <ImageIcon className="h-8 w-8 text-gray-300" />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <h3 className="font-bold text-lg">{event.title}</h3>
                                            <p className="text-sm text-gray-500 mb-2">
                                                {format(new Date(event.date), 'PPP p')} • {event.location} • ${event.price}
                                            </p>
                                            <p className="text-gray-600 line-clamp-2 text-sm">{event.description}</p>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <button
                                                onClick={() => handleEditClick(event)}
                                                className="text-primary hover:text-primary/70 p-2"
                                            >
                                                <Edit2 className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => deleteEvent(event.id)}
                                                className="text-red-500 hover:text-red-700 p-2"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'blogs' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <BlogManager />
                </div>
            )}

            {activeTab === 'visa' && (
                <div className="max-w-5xl mx-auto">
                    <VisaInvitationManager />
                </div>
            )}
        </div>
    );
}

