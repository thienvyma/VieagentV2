"use client";

import { Agent } from "@/types/agent";
import { MyAgentCard } from "./my-agent-card";
import { Button } from "@/components/core/ui/button";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

interface MyAgentsGridProps {
    agents: Agent[];
}

export function MyAgentsGrid({ agents }: MyAgentsGridProps) {
    if (agents.length === 0) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center py-16 border rounded-lg bg-muted/10 border-dashed"
            >
                <div className="flex justify-center mb-4">
                    <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center">
                        <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                    </div>
                </div>
                <h3 className="text-lg font-medium">You haven&apos;t purchased any agents yet.</h3>
                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                    Visit the marketplace to find powerful AI tools to automate your workflow.
                </p>
                <Link href="/marketplace">
                    <Button>Browse Marketplace</Button>
                </Link>
            </motion.div>
        )
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {agents.map((agent: Agent, index) => (
                <motion.div
                    key={agent.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                    <MyAgentCard agent={agent} />
                </motion.div>
            ))}
        </div>
    );
}
