import Link from "next/link";
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

interface AgentCardProps {
    agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
    return (
        <Card className="flex flex-col h-full hover:shadow-md transition-shadow">
            {/* Cover Image Placeholder */}
            <div className="h-40 w-full bg-muted/50 rounded-t-xl flex items-center justify-center text-muted-foreground">
                {agent.cover_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={agent.cover_image} alt={agent.name} className="h-full w-full object-cover rounded-t-xl" />
                ) : (
                    <span className="text-4xl">🤖</span>
                )}
            </div>

            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="text-xl line-clamp-1">{agent.name}</CardTitle>
                    <Badge variant="secondary">{agent.category || "General"}</Badge>
                </div>
                <CardDescription className="line-clamp-2 min-h-[40px]">
                    {agent.description}
                </CardDescription>
            </CardHeader>

            <CardContent className="flex-grow">
                {/* Additional metadata could go here */}
            </CardContent>

            <CardFooter className="flex justify-between items-center border-t pt-4">
                <div className="font-semibold">
                    {agent.price > 0 ? (
                        new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(agent.price)
                    ) : (
                        <span className="text-green-600">Free</span>
                    )}
                </div>
                <Link href={`/agent/${agent.id}`}>
                    <Button size="sm">View Details</Button>
                </Link>
            </CardFooter>
        </Card>
    );
}
