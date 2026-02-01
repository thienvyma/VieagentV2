import { createClient } from "@/utils/supabase/server";
import { AgentGrid } from "@/components/business/marketplace/agent-grid";
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
        <div className="container py-10 space-y-8">
            <div className="flex flex-col space-y-2">
                <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">{t('title')}</h1>
                <p className="text-muted-foreground text-lg">
                    {t('subtitle')}
                </p>
            </div>

            <div className="border-t pt-8">
                <AgentGrid agents={(agents as unknown as Agent[]) || []} />
            </div>
        </div>
    );
}
