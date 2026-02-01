"use client";

import { useState } from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/core/ui/table";
import { Badge } from "@/components/core/ui/badge";
import { Button } from "@/components/core/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/core/ui/dialog";
import {
    CheckCircle2,
    XCircle,
    Loader2,
    Clock,
    Eye,
    Bot
} from "lucide-react";
import ReactMarkdown from "react-markdown";

interface ExecutionRecord {
    id: string;
    agent_id: string;
    status: "pending" | "running" | "success" | "failed";
    result: unknown;
    started_at: string;
    completed_at: string | null;
    agents: {
        name: string;
        cover_image?: string;
    } | null;
}

interface ExecutionHistoryTableProps {
    executions: ExecutionRecord[];
}

const statusConfig = {
    pending: {
        label: "Pending",
        icon: Clock,
        variant: "secondary" as const,
        className: "text-yellow-600 dark:text-yellow-400"
    },
    running: {
        label: "Running",
        icon: Loader2,
        variant: "secondary" as const,
        className: "text-blue-600 dark:text-blue-400 animate-spin"
    },
    success: {
        label: "Success",
        icon: CheckCircle2,
        variant: "default" as const,
        className: "text-green-600 dark:text-green-400"
    },
    failed: {
        label: "Failed",
        icon: XCircle,
        variant: "destructive" as const,
        className: "text-red-600 dark:text-red-400"
    }
};

export function ExecutionHistoryTable({ executions }: ExecutionHistoryTableProps) {
    const [selectedResult, setSelectedResult] = useState<unknown>(null);

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const formatDuration = (start: string, end: string | null) => {
        if (!end) return "-";
        const duration = new Date(end).getTime() - new Date(start).getTime();
        if (duration < 1000) return `${duration}ms`;
        if (duration < 60000) return `${(duration / 1000).toFixed(1)}s`;
        return `${(duration / 60000).toFixed(1)}m`;
    };

    const renderResult = (result: unknown) => {
        if (!result) return <p className="text-muted-foreground">No result data</p>;

        if (typeof result === "string") {
            return (
                <div className="prose dark:prose-invert max-w-none">
                    <ReactMarkdown>{result}</ReactMarkdown>
                </div>
            );
        }

        return (
            <pre className="bg-muted p-4 rounded-lg overflow-auto max-h-96 text-sm">
                {JSON.stringify(result, null, 2)}
            </pre>
        );
    };

    if (executions.length === 0) {
        return (
            <div className="text-center py-16 bg-muted/20 rounded-lg border border-dashed">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                    <Bot className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium mb-2">No executions yet</h3>
                <p className="text-muted-foreground">
                    Run an agent from the marketplace to see history here.
                </p>
            </div>
        );
    }

    return (
        <div className="border rounded-lg overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Agent</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Started</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {executions.map((execution) => {
                        const config = statusConfig[execution.status];
                        const Icon = config.icon;

                        return (
                            <TableRow key={execution.id}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden">
                                            {execution.agents?.cover_image ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={execution.agents.cover_image}
                                                    alt={execution.agents.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <Bot className="h-5 w-5 text-muted-foreground" />
                                            )}
                                        </div>
                                        <span className="font-medium">
                                            {execution.agents?.name || "Unknown Agent"}
                                        </span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge variant={config.variant} className="gap-1">
                                        <Icon className={`h-3 w-3 ${config.className}`} />
                                        {config.label}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {formatDate(execution.started_at)}
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {formatDuration(execution.started_at, execution.completed_at)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setSelectedResult(execution.result)}
                                            >
                                                <Eye className="h-4 w-4 mr-1" />
                                                View
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl max-h-[80vh] overflow-auto">
                                            <DialogHeader>
                                                <DialogTitle>
                                                    Execution Result - {execution.agents?.name}
                                                </DialogTitle>
                                            </DialogHeader>
                                            <div className="mt-4">
                                                {renderResult(selectedResult)}
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
