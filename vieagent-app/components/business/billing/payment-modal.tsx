"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/core/ui/dialog";
import { Button } from "@/components/core/ui/button";
import { PaymentSettings } from "@/lib/payment-settings";
import { Agent } from "@/types/agent";
import { CreditCard, Landmark, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface PaymentModalProps {
    agent: Agent;
    settings: PaymentSettings;
    children: React.ReactNode;
    userId?: string;
}

export function PaymentModal({ agent, settings, children, userId }: PaymentModalProps) {
    const [open, setOpen] = useState(false);
    const [method, setMethod] = useState<"bank" | "stripe">(settings.stripe_enabled ? "stripe" : "bank");
    const [copied, setCopied] = useState(false);

    // Generate syntax dynamically if needed, or use static from settings
    const transferNote = settings.transfer_syntax
        .replace("[PHONE]", "YOUR_PHONE")
        .replace("[AGENT]", agent.name.substring(0, 10));

    const copyToClipboard = () => {
        navigator.clipboard.writeText(transferNote);
        setCopied(true);
        toast.success("Transfer content copied!");
        setTimeout(() => setCopied(false), 2000);
    };

    const handleBankTransferConfirm = async () => {
        // Here we would ideally call an API to create a "pending" purchase
        // For now, simple success message
        toast.success("Order request sent! We will verify and unlock shortly.");
        setOpen(false);
        // TODO: Call server action to record pending purchase
    };

    const handleStripeCheckout = async () => {
        if (!settings.stripe_enabled) return;
        toast.info("Stripe Checkout is coming soon!");
        // TODO: Call /api/stripe/checkout
    };

    if (!userId) {
        // If not logged in, just pass through to login logic or show nothing
        // The parent usually handles login redirect
        return <>{children}</>;
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Complete Purchase</DialogTitle>
                    <DialogDescription>
                        Unlock <strong>{agent.name}</strong> for {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(agent.price)}
                    </DialogDescription>
                </DialogHeader>

                {/* Tabs */}
                <div className="flex items-center gap-2 p-1 bg-muted rounded-lg mb-4">
                    {settings.stripe_enabled && (
                        <button
                            onClick={() => setMethod("stripe")}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all",
                                method === "stripe" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <CreditCard className="w-4 h-4" />
                            Credit Card
                        </button>
                    )}
                    <button
                        onClick={() => setMethod("bank")}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all",
                            method === "bank" ? "bg-background shadow text-foreground" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        <Landmark className="w-4 h-4" />
                        Bank Transfer
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-4">
                    {method === "bank" ? (
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-muted/50 space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Bank:</span>
                                    <span className="font-medium">{settings.bank_name || "Contact Support"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Account Name:</span>
                                    <span className="font-medium">{settings.bank_account_name || "VIAGENT ADMIN"}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Account No:</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-bold text-lg tracking-wider select-all">
                                            {settings.bank_account_num || "0000000000"}
                                        </span>
                                    </div>
                                </div>
                                <div className="pt-2 border-t">
                                    <span className="text-muted-foreground block mb-1">Transfer Content:</span>
                                    <div
                                        className="flex items-center justify-between p-2 rounded bg-background border cursor-pointer hover:border-primary transition-colors"
                                        onClick={copyToClipboard}
                                    >
                                        <code className="font-mono font-bold text-primary">{transferNote}</code>
                                        {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-muted-foreground" />}
                                    </div>
                                </div>
                            </div>
                            <Button className="w-full" onClick={handleBankTransferConfirm}>
                                I have transferred
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4 py-4 text-center">
                            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                                <CreditCard className="w-6 h-6 text-primary" />
                            </div>
                            <h3 className="font-medium">Secure Payment via Stripe</h3>
                            <p className="text-sm text-muted-foreground">
                                You will be redirected to Stripe to complete your purchase securely.
                            </p>
                            <Button className="w-full" onClick={handleStripeCheckout}>
                                Proceed to Checkout
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
