import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { Agent } from "@/types/agent";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/core/ui/button";
import { Badge } from "@/components/core/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/core/ui/card";
import {
    Star,
    Zap,
    Shield,
    Clock,
    Users,
    ArrowLeft,
    Play,
    ShoppingCart,
    CheckCircle2
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { getPaymentSettings } from "@/lib/payment-settings";
import { PaymentModal } from "@/components/business/billing/payment-modal";

interface AgentDetailPageProps {
    params: Promise<{ id: string; locale: string }>;
}

export default async function AgentDetailPage({ params }: AgentDetailPageProps) {
    const { id, locale } = await params;
    const supabase = await createClient();
    const t = await getTranslations("AgentDetail");
    const settings = await getPaymentSettings();

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch agent details
    const { data: agent, error } = await supabase
        .from("agents")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !agent) {
        notFound();
    }

    const typedAgent = agent as unknown as Agent;

    // Check if user already owns this agent
    let ownsAgent = false;
    if (user) {
        const { data: purchase } = await supabase
            .from("purchases")
            .select("id")
            .eq("user_id", user.id)
            .eq("agent_id", id)
            .single();
        ownsAgent = !!purchase;
    }

    // Format price
    const formatPrice = (price: number) => {
        if (price === 0) return "Free";
        return new Intl.NumberFormat("vi-VN", {
            style: "currency",
            currency: "VND"
        }).format(price);
    };

    // Complexity badge colors
    const complexityColors = {
        beginner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
        intermediate: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
        advanced: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
            {/* Back Button */}
            <div className="container pt-6">
                <Link href={`/${locale}/marketplace`}>
                    <Button variant="ghost" size="sm">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t("backToMarketplace")}
                    </Button>
                </Link>
            </div>

            {/* Hero Section */}
            <div className="container py-8">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Left: Agent Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Cover Image */}
                        <div className="relative h-64 w-full rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-purple-600/20 flex items-center justify-center">
                            {typedAgent.cover_image ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                    src={typedAgent.cover_image}
                                    alt={typedAgent.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span className="text-8xl">🤖</span>
                            )}
                        </div>

                        {/* Title & Meta */}
                        <div className="space-y-4">
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-3xl font-bold">{typedAgent.name}</h1>
                                <Badge variant="secondary">{typedAgent.category || "General"}</Badge>
                                {typedAgent.complexity && (
                                    <Badge className={complexityColors[typedAgent.complexity]}>
                                        {typedAgent.complexity}
                                    </Badge>
                                )}
                            </div>

                            <p className="text-lg text-muted-foreground">
                                {typedAgent.description}
                            </p>

                            {/* Stats Row */}
                            <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                                {typedAgent.rating && (
                                    <div className="flex items-center gap-1">
                                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                        <span className="font-medium text-foreground">{typedAgent.rating.toFixed(1)}</span>
                                        {typedAgent.review_count && (
                                            <span>({typedAgent.review_count} reviews)</span>
                                        )}
                                    </div>
                                )}
                                {typedAgent.execution_count !== undefined && (
                                    <div className="flex items-center gap-1">
                                        <Zap className="h-4 w-4" />
                                        <span>{typedAgent.execution_count.toLocaleString()} runs</span>
                                    </div>
                                )}
                                <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    <span>Added {new Date(typedAgent.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Features */}
                        {typedAgent.features && typedAgent.features.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">{t("features")}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="grid sm:grid-cols-2 gap-3">
                                        {typedAgent.features.map((feature, i) => (
                                            <li key={i} className="flex items-start gap-2">
                                                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}

                        {/* Long Description */}
                        {typedAgent.long_description && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">{t("description")}</CardTitle>
                                </CardHeader>
                                <CardContent className="prose dark:prose-invert max-w-none">
                                    <ReactMarkdown>{typedAgent.long_description}</ReactMarkdown>
                                </CardContent>
                            </Card>
                        )}

                        {/* Requirements */}
                        {typedAgent.required_credential_types && typedAgent.required_credential_types.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Shield className="h-5 w-5" />
                                        {t("requirements")}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground mb-3">
                                        {t("requirementsDesc")}
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {typedAgent.required_credential_types.map((cred) => (
                                            <Badge key={cred} variant="outline" className="capitalize">
                                                {cred} API Key
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>

                    {/* Right: Pricing Card (Sticky) */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-24">
                            <Card className="border-2 shadow-lg">
                                <CardHeader className="text-center border-b">
                                    <div className="text-3xl font-bold">
                                        {formatPrice(typedAgent.price)}
                                    </div>
                                    {typedAgent.price_monthly && typedAgent.price_monthly > 0 && (
                                        <p className="text-sm text-muted-foreground">
                                            or {formatPrice(typedAgent.price_monthly)}/month
                                        </p>
                                    )}
                                </CardHeader>
                                <CardContent className="p-6 space-y-4">
                                    {!user ? (
                                        <>
                                            <Link href={`/${locale}/login`} className="block">
                                                <Button className="w-full" size="lg">
                                                    <Users className="mr-2 h-4 w-4" />
                                                    {t("loginToBuy")}
                                                </Button>
                                            </Link>
                                            <p className="text-xs text-center text-muted-foreground">
                                                {t("loginRequired")}
                                            </p>
                                        </>
                                    ) : ownsAgent ? (
                                        <>
                                            <Link href={`/${locale}/dashboard/run/${id}`} className="block">
                                                <Button className="w-full" size="lg" variant="default">
                                                    <Play className="mr-2 h-4 w-4" />
                                                    {t("runAgent")}
                                                </Button>
                                            </Link>
                                            <p className="text-xs text-center text-green-600 dark:text-green-400">
                                                ✓ {t("owned")}
                                            </p>
                                        </>
                                    ) : typedAgent.price === 0 ? (
                                        <>
                                            <Link href={`/${locale}/dashboard/run/${id}`} className="block">
                                                <Button className="w-full" size="lg">
                                                    <Play className="mr-2 h-4 w-4" />
                                                    {t("tryFree")}
                                                </Button>
                                            </Link>
                                            <p className="text-xs text-center text-muted-foreground">
                                                {t("freeToUse")}
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <PaymentModal agent={typedAgent} settings={settings} userId={user?.id}>
                                                <Button className="w-full" size="lg">
                                                    <ShoppingCart className="mr-2 h-4 w-4" />
                                                    {t("buyNow")}
                                                </Button>
                                            </PaymentModal>
                                            <p className="text-xs text-center text-muted-foreground">
                                                {t("oneTimePurchase")}
                                            </p>
                                        </>
                                    )}

                                    {/* Trust Badges */}
                                    <div className="pt-4 border-t space-y-2 text-sm text-muted-foreground">
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-green-500" />
                                            <span>{t("securePayment")}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Zap className="h-4 w-4 text-yellow-500" />
                                            <span>{t("instantAccess")}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
