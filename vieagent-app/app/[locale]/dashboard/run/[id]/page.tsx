import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { Agent } from "@/types/agent";
import { RunAgentView } from "./view";

interface RunAgentPageProps {
    params: Promise<{ id: string }>;
}

export default async function RunAgentPage({ params }: RunAgentPageProps) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    // 1. Fetch Agent
    const { data: agentData, error } = await supabase
        .from("agents")
        .select("*")
        .eq("id", id)
        .single();

    if (error || !agentData) notFound();

    const agent = agentData as unknown as Agent;

    // 2. Check Access (Free OR Purchased OR Subscribed)
    let hasAccess = agent.price === 0;

    if (!hasAccess) {
        const { data: purchase } = await supabase.from('user_purchases').select('id').eq('user_id', user.id).eq('agent_id', agent.id).single();
        if (purchase) hasAccess = true;
        else {
            const { data: sub } = await supabase.from('user_subscriptions').select('id').eq('user_id', user.id).eq('agent_id', agent.id).eq('status', 'active').single();
            if (sub) hasAccess = true;
        }
    }

    if (!hasAccess) {
        // Redirect to store entry
        redirect(`/agent/${agent.id}`);
    }

    // 3. Fetch Credentials for Form
    const { data: credentials } = await supabase.from("credentials").select("id, key_name, provider").eq("user_id", user.id);

    // Render Client View
    return (
        <RunAgentView agent={agent} credentials={credentials || []} />
    );
}
