import { createClient } from "@/utils/supabase/server";
import { MyAgentsGrid } from "@/components/business/dashboard/my-agents-grid";
import { Agent } from "@/types/agent";
import { getTranslations } from "next-intl/server";

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const t = await getTranslations("Dashboard");

    // Fetch logic for "My Agents"
    // Since we don't have real "purchase" data yet, we will:
    // 1. Fetch ALL published agents for demo purposes OR
    // 2. Fetch actually purchased (returns empty).
    // I will implement REAL logic, but then fallback to empty.

    if (!user) return null;

    // 1. Get IDs from purchases
    // 1. Get IDs from purchases
    const { data: purchases } = await supabase.from('user_purchases').select('agent_id').eq('user_id', user.id);
    // 2. Get IDs from subscriptions
    const { data: subscriptions } = await supabase.from('user_subscriptions').select('agent_id').eq('user_id', user.id).eq('status', 'active');
    // 3. Get Free Agents
    const { data: freeAgents } = await supabase.from('agents').select('id').eq('price', 0);

    const agentIds = new Set([
        ...(purchases?.map(p => p.agent_id) || []),
        ...(subscriptions?.map(s => s.agent_id) || []),
        ...(freeAgents?.map(f => f.id) || [])
    ]);

    let myAgents: Agent[] = [];

    if (agentIds.size > 0) {
        const { data: agents } = await supabase.from('agents').select('*').in('id', Array.from(agentIds));
        myAgents = (agents as unknown as Agent[]) || [];
    }

    // --- DEMO MODE: IF EMPTY, SHOW ONE "FREE" AGENT IF EXISTS ---
    // If user has no agents, we might want to show them the Free ones automatically?
    // Let's stick to strict logic: Empty = Empty.

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('myAgents')}</h1>
                <p className="text-muted-foreground">
                    Manage and run your AI tools.
                </p>
            </div>

            <MyAgentsGrid agents={myAgents} />
        </div>
    );
}
