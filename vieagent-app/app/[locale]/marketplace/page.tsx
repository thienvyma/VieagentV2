import { createClient } from "@/utils/supabase/server";
import { AgentMarketplaceClient } from "@/components/business/marketplace/agent-marketplace-client";
import { Agent } from "@/types/agent";
import { getTranslations } from "next-intl/server";

// Set revalidation time (e.g. 60 seconds) or dynamic
export const revalidate = 60;

export default async function MarketplacePage() {
    const supabase = await createClient();
    const t = await getTranslations("Marketplace");

    // Fetch published agents
    const { data: agents, error } = await supabase
        .from("agents")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching agents:", error);
    }

    return (
        <div className="container py-12 space-y-12 min-h-screen bg-gradient-to-b from-background to-muted/20">
            {/* Hero Section */}
            <div className="flex flex-col items-center text-center space-y-4 max-w-3xl mx-auto pt-8">
                <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20">
                    Agent Store
                </div>
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-6xl bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent pb-2">
                    {t('title')}
                </h1>
                <p className="text-muted-foreground text-lg md:text-xl max-w-[42rem] leading-normal">
                    {t('subtitle')}
                </p>
            </div>

            {/* Marketplace Client */}
            <div className="pb-16">
                <AgentMarketplaceClient
                    agents={(agents as unknown as Agent[]) || []}
                    emptyMessage={t('noAgents')}
                    emptySubMessage={t('checkBack')}
                />
            </div>
        </div>
    );
}

