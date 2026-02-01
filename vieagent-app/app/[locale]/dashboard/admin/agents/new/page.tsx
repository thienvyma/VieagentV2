import { AgentEditor } from "@/components/business/admin/agent-editor";

export default function NewAgentPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">New Agent</h1>
                <p className="text-muted-foreground">Create a new AI tool.</p>
            </div>
            <AgentEditor />
        </div>
    );
}
