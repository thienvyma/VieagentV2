import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import { AgentEditor } from "@/components/business/admin/agent-editor";

interface EditAgentPageProps {
    params: { id: string };
}

export default async function EditAgentPage({ params }: EditAgentPageProps) {
    const supabase = await createClient();
    const { data: agent } = await supabase.from('agents').select('*').eq('id', params.id).single();

    if (!agent) {
        notFound();
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Edit Agent</h1>
                <p className="text-muted-foreground">Modify existing tool configuration.</p>
            </div>
            <AgentEditor initialData={agent} />
        </div>
    );
}
