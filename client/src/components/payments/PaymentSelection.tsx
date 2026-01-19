import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CreditCard, Wallet, AlertCircle } from "lucide-react";

interface PaymentSelectionProps {
    amount: number;
    onSelect: (method: 'stripe' | 'paypal') => void;
    isProcessing?: boolean;
}

export default function PaymentSelection({ amount, onSelect, isProcessing }: PaymentSelectionProps) {
    return (
        <div className="space-y-6">
            <div className="text-center space-y-2">
                <p className="text-slate-500 font-medium">Total Amount to Pay</p>
                <p className="text-4xl font-bold text-primary">${amount.toFixed(2)}</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
                <Button
                    variant="outline"
                    className="h-24 rounded-2xl flex items-center justify-between px-6 border-2 hover:border-primary hover:bg-primary/5 transition-all group"
                    onClick={() => onSelect('stripe')}
                    disabled={isProcessing}
                >
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-slate-100 rounded-xl group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                            <CreditCard className="h-6 w-6" />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-lg">Pay with Card</p>
                            <p className="text-sm text-slate-500">Secure payment via Stripe</p>
                        </div>
                    </div>
                </Button>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex gap-3 text-amber-800 text-sm">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p>All payments are processed securely. Your booking will be confirmed immediately after successful payment.</p>
            </div>
        </div>
    );
}
