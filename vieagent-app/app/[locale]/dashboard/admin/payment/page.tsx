import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getPaymentSettings, savePaymentSettings, PaymentSettings } from "@/lib/payment-settings";
import { Button } from "@/components/core/ui/button";
import { Input } from "@/components/core/ui/input";
import { Label } from "@/components/core/ui/label";
import { Card, CardContent } from "@/components/core/ui/card";
import { Switch } from "@/components/core/ui/switch";
import { CreditCard, Landmark, CheckCircle2, AlertCircle, Wallet, ArrowRight } from "lucide-react";
import { Badge } from "@/components/core/ui/badge";
import { Separator } from "@/components/core/ui/separator";

export default async function AdminPaymentPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    // Check Admin Role
    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") redirect("/dashboard");

    const settings = await getPaymentSettings();

    async function updateSettings(formData: FormData) {
        "use server";

        const rawSettings: PaymentSettings = {
            bank_name: formData.get("bank_name") as string,
            bank_account_num: formData.get("bank_account_num") as string,
            bank_account_name: formData.get("bank_account_name") as string,
            transfer_syntax: formData.get("transfer_syntax") as string,
            stripe_enabled: formData.get("stripe_enabled") === "on"
        };

        try {
            await savePaymentSettings(rawSettings);
        } catch (error) {
            console.error("Failed to save settings:", error);
        }
    }

    return (
        <div className="max-w-6xl mx-auto space-y-10 pb-20">
            {/* Header Section */}
            <div className="flex flex-col gap-4 border-b pb-8">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Dashboard</span>
                    <span className="text-muted-foreground/50">/</span>
                    <span>Admin</span>
                    <span className="text-muted-foreground/50">/</span>
                    <span className="text-foreground font-medium">Payment Settings</span>
                </div>
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Payment Gateway
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl">
                        Configure how your users purchase agents. Enable automated Stripe payments or set up manual bank transfers.
                    </p>
                </div>
            </div>

            <form action={updateSettings} className="space-y-12">
                <div className="grid lg:grid-cols-12 gap-10">

                    {/* Left Column: Configuration Forms (7 cols) */}
                    <div className="lg:col-span-12 xl:col-span-7 space-y-10">

                        {/* SECTION 1: MANUAL TRANSFER */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                    <Landmark className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold">Bank Transfer (Manual)</h2>
                                    <p className="text-sm text-muted-foreground">Traditional bank transfer details.</p>
                                </div>
                            </div>

                            <Card className="border shadow-none bg-card/50 backdrop-blur-sm">
                                <CardContent className="p-6 grid gap-6">
                                    <div className="grid sm:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-foreground/80">Bank Name</Label>
                                            <div className="relative group">
                                                <Landmark className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                <Input
                                                    name="bank_name"
                                                    defaultValue={settings.bank_name}
                                                    placeholder="EXIMBANK"
                                                    className="pl-9 bg-background/50 focus:bg-background border-muted hover:border-border focus:border-primary transition-all"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-foreground/80">Account Number</Label>
                                            <div className="relative group">
                                                <CreditCard className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                <Input
                                                    name="bank_account_num"
                                                    defaultValue={settings.bank_account_num}
                                                    placeholder="1234 5678 9999"
                                                    className="pl-9 font-mono bg-background/50 focus:bg-background border-muted hover:border-border focus:border-primary transition-all"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-foreground/80">Account Owner Name</Label>
                                        <div className="relative group">
                                            <div className="absolute left-3 top-2.5 h-4 w-5 flex items-center justify-center text-[9px] font-bold border rounded bg-muted/20 text-muted-foreground group-focus-within:text-primary group-focus-within:border-primary transition-colors">ID</div>
                                            <Input
                                                name="bank_account_name"
                                                defaultValue={settings.bank_account_name}
                                                placeholder="NGUYEN VAN A"
                                                className="pl-10 uppercase bg-background/50 focus:bg-background border-muted hover:border-border focus:border-primary transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-foreground/80">Transfer Syntax Preview</Label>
                                        <div className="relative group">
                                            <Input
                                                name="transfer_syntax"
                                                defaultValue={settings.transfer_syntax}
                                                placeholder="VIEAGENT [PHONE]"
                                                className="bg-secondary/40 border-transparent focus:border-primary focus:bg-background font-mono text-secondary-foreground transition-all"
                                            />
                                            <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1.5">
                                                <CheckCircle2 className="h-3 w-3 text-green-500" />
                                                This code helps identify the transaction automatically (future).
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <Separator className="bg-border/60" />

                        {/* SECTION 2: STRIPE */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                    <Wallet className="h-5 w-5" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold">Stripe Payment</h2>
                                    <p className="text-sm text-muted-foreground">Automated credit card processing.</p>
                                </div>
                            </div>

                            <Card className={`border overflow-hidden transition-all duration-300 ${settings.stripe_enabled ? 'ring-2 ring-primary/20 border-primary/50 shadow-lg shadow-primary/5' : 'shadow-none'}`}>
                                <div className="p-6 space-y-6">
                                    {/* Feature Toggle */}
                                    <div className="flex items-center justify-between p-5 rounded-xl border border-border/50 bg-card shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2">
                                                    <Label htmlFor="stripe_enabled" className="text-base font-semibold cursor-pointer text-foreground">Enable Stripe Integration</Label>
                                                    {settings.stripe_enabled ? (
                                                        <Badge className="bg-green-600 hover:bg-green-700 pointer-events-none">Active</Badge>
                                                    ) : (
                                                        <Badge variant="outline" className="text-muted-foreground pointer-events-none">Disabled</Badge>
                                                    )}
                                                </div>
                                                <p className="text-sm text-muted-foreground">Accept Visa, Mastercard, Amex globally.</p>
                                            </div>
                                        </div>
                                        <Switch
                                            id="stripe_enabled"
                                            name="stripe_enabled"
                                            defaultChecked={settings.stripe_enabled}
                                            className="data-[state=checked]:bg-green-500 data-[state=unchecked]:bg-red-500 border-2 border-transparent shadow-sm"
                                        />
                                    </div>

                                    {/* Credentials Check */}
                                    <div className={`grid gap-3 transition-opacity duration-200 ${settings.stripe_enabled ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
                                        <div className="text-sm font-medium mb-1">Integration Status</div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className={`p-3 rounded-lg border flex items-center justify-between ${process.env.STRIPE_SECRET_KEY ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800'}`}>
                                                <div className="flex items-center gap-2">
                                                    <div className={`h-2 w-2 rounded-full ${process.env.STRIPE_SECRET_KEY ? 'bg-green-500' : 'bg-red-500'}`} />
                                                    <span className="text-sm font-medium">Secret Key</span>
                                                </div>
                                                {process.env.STRIPE_SECRET_KEY ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
                                            </div>
                                            <div className={`p-3 rounded-lg border flex items-center justify-between ${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : 'bg-red-50/50 dark:bg-red-900/10 border-red-200 dark:border-red-800'}`}>
                                                <div className="flex items-center gap-2">
                                                    <div className={`h-2 w-2 rounded-full ${process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'bg-green-500' : 'bg-red-500'}`} />
                                                    <span className="text-sm font-medium">Publishable Key</span>
                                                </div>
                                                {process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? <CheckCircle2 className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                    </div>

                    {/* Right Column: Visual Preview & Save (5 cols) - Sticky */}
                    <div className="lg:col-span-12 xl:col-span-5 relative">
                        <div className="sticky top-24 space-y-8">

                            {/* Visual Preview Card */}
                            <div className="space-y-4">
                                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Checkout Experience Preview</Label>

                                {/* Mockup */}
                                <div className="relative rounded-2xl border bg-card shadow-xl overflow-hidden group hover:shadow-2xl transition-all duration-500">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-purple-500/5 pointer-events-none" />

                                    <div className="p-6 space-y-6">
                                        {/* Mock Header */}
                                        <div className="flex items-center justify-between border-b pb-4">
                                            <div className="space-y-1">
                                                <div className="h-3 w-20 bg-muted-foreground/20 rounded animate-pulse" />
                                                <div className="h-5 w-32 bg-foreground/80 rounded" />
                                            </div>
                                            <div className="h-8 w-8 rounded-full bg-primary/10" />
                                        </div>

                                        {/* Mock Payment Options */}
                                        <div className="space-y-3">
                                            <div className="p-3 rounded-lg border bg-background/50 flex items-center justify-between opacity-50">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-4 w-4 rounded-full border border-primary/50" />
                                                    <span className="text-sm font-medium">Credit Card</span>
                                                </div>
                                                <div className="flex gap-1">
                                                    <div className="h-4 w-6 bg-muted rounded" />
                                                    <div className="h-4 w-6 bg-muted rounded" />
                                                </div>
                                            </div>

                                            {/* Active Manual Option */}
                                            <div className="p-4 rounded-lg border-2 border-primary bg-primary/5 relative">
                                                <div className="absolute -right-[1px] -top-[1px] bg-primary text-primary-foreground text-[9px] px-1.5 py-0.5 rounded-bl font-bold">SELECTED</div>
                                                <div className="flex items-center gap-3 mb-3">
                                                    <div className="h-4 w-4 rounded-full border-[5px] border-primary" />
                                                    <span className="text-sm font-semibold">Bank Transfer</span>
                                                </div>

                                                <div className="space-y-3 pl-7">
                                                    <div className="p-3 bg-white dark:bg-black/20 rounded border border-dashed border-primary/30 space-y-2">
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-muted-foreground">Bank:</span>
                                                            <span className="font-medium">{settings.bank_name || "VIETCOMBANK"}</span>
                                                        </div>
                                                        <div className="flex justify-between text-xs">
                                                            <span className="text-muted-foreground">Number:</span>
                                                            <span className="font-mono font-medium">{settings.bank_account_num || "0000..."}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Mock Button */}
                                        <div className="h-10 w-full bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-medium text-sm shadow-lg shadow-primary/25">
                                            Confirm Payment
                                        </div>
                                    </div>
                                </div>
                                <p className="text-xs text-center text-muted-foreground">
                                    Changes reflect immediately on the checkout modal.
                                </p>
                            </div>

                            <Separator />

                            {/* Save Button */}
                            <Button type="submit" size="lg" className="w-full text-base py-6 shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">
                                Save Changes
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>

                        </div>
                    </div>

                </div>
            </form>
        </div>
    );
}
