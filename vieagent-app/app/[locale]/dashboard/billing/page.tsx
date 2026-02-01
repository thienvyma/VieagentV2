import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/core/ui/card";
import { Badge } from "@/components/core/ui/badge";
import { CreditCard, Package } from "lucide-react";
import { format } from "date-fns";

export default async function BillingPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    // 1. Fetch Subscriptions
    const { data: subscriptions } = await supabase
        .from("user_subscriptions")
        .select("*, agents(name, price)")
        .eq("user_id", user.id);

    // 2. Fetch One-Time Purchases
    const { data: purchases } = await supabase
        .from("user_purchases")
        .select("*, agents(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Billing & Usage</h1>
                <p className="text-muted-foreground">
                    Manage your subscriptions and purchase history.
                </p>
            </div>

            {/* Active Subscriptions */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5" /> Active Subscriptions
                    </CardTitle>
                    <CardDescription>Recurring monthly payments for agents.</CardDescription>
                </CardHeader>
                <CardContent>
                    {!subscriptions || subscriptions.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No active subscriptions.</p>
                    ) : (
                        <div className="space-y-4">
                            {subscriptions.map((sub: any) => (
                                <div key={sub.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                    <div>
                                        <p className="font-medium">
                                            {Array.isArray(sub.agents) ? sub.agents[0]?.name : sub.agents?.name || "Unknown Agent"}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Next billing: {format(new Date(sub.current_period_end), "PPP")}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge variant={sub.status === 'active' ? 'default' : 'destructive'} className="capitalize">
                                            {sub.status}
                                        </Badge>
                                        <span className="text-sm font-medium">
                                            ${((Array.isArray(sub.agents) ? sub.agents[0]?.price : sub.agents?.price) / 100 || 0).toFixed(2)}/mo
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Purchase History */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" /> Order History
                    </CardTitle>
                    <CardDescription>One-time purchases and transactions.</CardDescription>
                </CardHeader>
                <CardContent>
                    {!purchases || purchases.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No purchase history.</p>
                    ) : (
                        <div className="space-y-4">
                            {purchases.map((purchase: any) => (
                                <div key={purchase.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                    <div>
                                        <p className="font-medium">
                                            {Array.isArray(purchase.agents) ? purchase.agents[0]?.name : purchase.agents?.name || "Unknown Item"}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            Purchased on {format(new Date(purchase.created_at), "PPP")}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm font-medium">
                                            ${(purchase.amount / 100).toFixed(2)}
                                        </span>
                                        {purchase.receipt_url && (
                                            <a href={purchase.receipt_url} target="_blank" className="text-xs text-blue-600 hover:underline">
                                                Receipt
                                            </a>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
