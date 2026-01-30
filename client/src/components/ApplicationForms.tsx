import { useState } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Upload } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

interface ApplicationFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    type: 'SPEAKER' | 'SPONSOR' | 'NEXTGEN' | 'GLOBAL_FORUM';
    title: string;
    onSuccess: (applicationId: string, amount: number) => void;
}

export function ApplicationForm({ open, onOpenChange, type, title, onSuccess }: ApplicationFormProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            description: "",
            donationAmount: 100
        }
    });

    const uploadDocument = async (userId: string) => {
        if (!file) return null;

        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        try {
            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('documents').getPublicUrl(filePath);
            return data.publicUrl;
        } catch (error) {
            console.error('Upload error:', error);
            throw new Error("Failed to upload document");
        }
    };

    const mutation = useMutation({
        mutationFn: async (data: { description: string, donationAmount: number }) => {
            if (!user) throw new Error("Please login first");

            setUploading(true);
            let docUrl = null;
            if (file) {
                docUrl = await uploadDocument(user.id);
            }
            setUploading(false);

            const { data: application, error } = await supabase
                .from('Applications')
                .insert({
                    userId: user.id,
                    type,
                    description: data.description,
                    donationAmount: data.donationAmount,
                    documentUrl: docUrl,
                    status: 'PENDING',
                    paymentStatus: 'PENDING'
                })
                .select()
                .single();

            if (error) throw error;
            return application;
        },
        onSuccess: (data) => {
            toast({ title: "Application Submitted", description: "Proceeding to donation..." });
            onSuccess(data.id, Number(data.donationAmount));
            onOpenChange(false);
        },
        onError: (error: any) => {
            setUploading(false);
            toast({
                title: "Error",
                description: error.message || "Failed to submit application",
                variant: "destructive"
            });
        }
    });

    const onSubmit = (data: any) => {
        mutation.mutate(data);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        Submit your application and support the cause with a donation.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="description">About You / Proposal</Label>
                        <Textarea
                            id="description"
                            placeholder="Tell us why you want to join..."
                            className="min-h-[100px]"
                            {...register("description", { required: "Description is required", minLength: { value: 50, message: "Minimum 50 characters" } })}
                        />
                        {errors.description && <p className="text-sm text-red-500">{errors.description.message as string}</p>}
                    </div>

                    <div className="space-y-2">
                        <Label>Supporting Document (Optional)</Label>
                        <div className="flex items-center gap-4">
                            <Input
                                type="file"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                                className="hidden"
                                id="file-upload"
                            />
                            <Label
                                htmlFor="file-upload"
                                className="flex items-center gap-2 px-4 py-2 border rounded-md cursor-pointer hover:bg-slate-50 w-full justify-center"
                            >
                                <Upload className="h-4 w-4" />
                                {file ? file.name : "Upload Proposal/Resume"}
                            </Label>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="donation">Donation Amount ($)</Label>
                        <Input
                            type="number"
                            id="donation"
                            min="100"
                            step="1"
                            {...register("donationAmount", {
                                required: true,
                                min: { value: 100, message: "Minimum donation is $100" }
                            })}
                        />
                        <p className="text-xs text-slate-500">Minimum mandatory donation is $100</p>
                        {errors.donationAmount && <p className="text-sm text-red-500">{errors.donationAmount.message as string}</p>}
                    </div>

                    <Button type="submit" className="w-full" disabled={mutation.isLoading || uploading}>
                        {(mutation.isLoading || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit & Donate
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
