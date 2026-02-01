import { Link } from "@/i18n/routing";
import { Agent } from "@/types/agent";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/core/ui/card";
import { Button } from "@/components/core/ui/button";
import { Badge } from "@/components/core/ui/badge";
import { Star, Zap } from "lucide-react";

interface AgentCardProps {
    agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
    return (
        <Card className="flex flex-col h-full hover:shadow-lg hover:scale-[1.02] transition-all duration-300">
            {/* Cover Image Placeholder */}
            <div className="h-40 w-full bg-gradient-to-br from-primary/10 to-purple-600/10 rounded-t-xl flex items-center justify-center text-muted-foreground relative overflow-hidden">
                {agent.cover_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={agent.cover_image} alt={agent.name} className="h-full w-full object-cover" />
                ) : (
                    <span className="text-5xl">🤖</span>
                )}
                {/* Rating Badge */}
                {agent.rating && (
                    <div className="absolute top-2 right-2 bg-black/60 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        {agent.rating.toFixed(1)}
                    </div>
                )}
            </div>

            <CardHeader className="pb-2">
                <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg line-clamp-1">{agent.name}</CardTitle>
                    <Badge variant="secondary" className="shrink-0 text-xs">{agent.category || "General"}</Badge>
                </div>
                <CardDescription className="line-clamp-2 min-h-[40px] text-sm">
                    {agent.description}
                </CardDescription>
            </CardHeader>

            <CardContent className="flex-grow pb-2">
                {/* Stats */}
                {agent.execution_count !== undefined && agent.execution_count > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Zap className="h-3 w-3" />
                        <span>{agent.execution_count.toLocaleString()} runs</span>
                    </div>
                )}
            </CardContent>

            <CardFooter className="flex justify-between items-center border-t pt-4">
                <div className="font-semibold">
                    {agent.price > 0 ? (
                        new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(agent.price / 100)
                    ) : (
                        <span className="text-green-600 dark:text-green-400">Free</span>
                    )}
                </div>
                <Link href={`/agent/${agent.id}`}>
                    <Button size="sm" variant="default">View Details</Button>
                </Link>
            </CardFooter>
        </Card>
    );
}
