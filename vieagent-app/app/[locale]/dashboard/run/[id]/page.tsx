import { createClient } from "@/utils/supabase/server";
import { notFound, redirect } from "next/navigation";
import { DynamicForm } from "@/components/business/forms/dynamic-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/core/ui/card";
import { Agent } from "@/types/agent";

interface RunAgentPageProps {
    params: { id: string };
}

export default async function RunAgentPage({ params }: RunAgentPageProps) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    // 1. Fetch Agent
    const { data: agentData, error } = await supabase
        .from("agents")
        .select("*")
        .eq("id", params.id)
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

    // 4. Server Action for Submission
    async function executeAgentAction(formData: any) {
        "use server";

        // RE-VERIFY AUTH & PERMISSIONS
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Unauthorized");

        const agentId = params.id;

        // Fetch Agent Price & Access
        const { data: agent } = await supabase.from('agents').select('price').eq('id', agentId).single();
        if (!agent) throw new Error("Agent not found");

        let authorized = agent.price === 0;

        if (!authorized) {
            const { data: purchase } = await supabase.from('user_purchases').select('id').eq('user_id', user.id).eq('agent_id', agentId).single();
            if (purchase) authorized = true;
            else {
                const { data: sub } = await supabase.from('user_subscriptions').select('id').eq('user_id', user.id).eq('agent_id', agentId).eq('status', 'active').single();
                if (sub) authorized = true;
            }
        }

        if (!authorized) throw new Error("Forbidden: Purchase required.");

        console.log("EXECUTE AGENT:", agentId, formData);
        // Phase 4 Part 2: Connect to Flowise API
        return { success: true, message: "Agent execution started (Mock)" };
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h1 className="text-3xl font-bold">{agent.name}</h1>
                <p className="text-muted-foreground">Fill in the parameters below to run this agent.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuration</CardTitle>
                            <CardDescription>Provide the necessary inputs.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {agent.input_schema ? (
                                <DynamicForm
                                    schema={agent.input_schema}
                                    credentials={credentials || []}
                                    onSubmit={executeAgentAction}
                                />
                            ) : (
                                <div className="p-4 text-center text-muted-foreground bg-muted rounded">
                                    No inputs configured for this agent.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Execution History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">No recent runs.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
