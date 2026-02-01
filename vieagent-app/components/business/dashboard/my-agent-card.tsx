import Link from "next/link";
import { Agent } from "@/types/agent";
import {
    Card,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/core/ui/card";
import { Button } from "@/components/core/ui/button";
import { Badge } from "@/components/core/ui/badge";
import { Play } from "lucide-react";

interface MyAgentCardProps {
    agent: Agent;
}

export function MyAgentCard({ agent }: MyAgentCardProps) {
    return (
        <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="h-32 w-full bg-muted/30 rounded-t-xl flex items-center justify-center text-muted-foreground relative group">
                {/* Simple visualization or cover */}
                {agent.cover_image ? (
                    <img src={agent.cover_image} alt={agent.name} className="h-full w-full object-cover rounded-t-xl opacity-80 group-hover:opacity-100 transition-opacity" />
                ) : (
                    <span className="text-3xl">🤖</span>
                )}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
                    <Link href={`/dashboard/run/${agent.id}`}>
                        <Button size="icon" className="rounded-full h-12 w-12">
                            <Play className="h-5 w-5 ml-1" />
                        </Button>
                    </Link>
                </div>
            </div>

            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-lg line-clamp-1">{agent.name}</CardTitle>
                    <Badge variant="outline" className="ml-2 font-normal text-xs">{agent.category}</Badge>
                </div>
                <CardDescription className="line-clamp-2 text-xs">
                    {agent.description}
                </CardDescription>
            </CardHeader>

            <CardFooter className="flex-grow flex items-end pt-0">
                <Link href={`/dashboard/run/${agent.id}`} className="w-full">
                    <Button className="w-full gap-2" size="sm">
                        <Play className="h-4 w-4" /> Launch
                    </Button>
                </Link>
            </CardFooter>
        </Card>
    );
}
