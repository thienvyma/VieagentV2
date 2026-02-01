import { Agent } from "@/types/agent";
import { AgentCard } from "./agent-card";
import { getTranslations } from 'next-intl/server';

interface AgentGridProps {
    agents: Agent[];
}

export async function AgentGrid({ agents }: AgentGridProps) {
    const t = await getTranslations('Marketplace');

    if (agents.length === 0) {
        return (
            <div className="text-center py-24 bg-muted/20 rounded-lg border border-dashed border-muted-foreground/20">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <span className="text-2xl">🔍</span>
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">{t('noAgents')}</h3>
                <p className="text-muted-foreground">{t('checkBack')}</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {agents.map((agent) => (
                <AgentCard key={agent.id} agent={agent} />
            ))}
        </div>
    );
}
