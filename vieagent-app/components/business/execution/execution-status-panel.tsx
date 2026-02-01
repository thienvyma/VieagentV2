"use client";

import { Loader2, CheckCircle2, XCircle, Clock, Terminal } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/core/ui/card";
import { ScrollArea } from "@/components/core/ui/scroll-area";
import { Badge } from "@/components/core/ui/badge";
import ReactMarkdown from "react-markdown";
export type ExecutionStatus = 'idle' | 'running' | 'success' | 'failed';

interface ExecutionStatusPanelProps {
    status: ExecutionStatus;
    result: unknown;
    error?: string;
    executionTime?: number;
}

export function ExecutionStatusPanel({ status, result, error, executionTime }: ExecutionStatusPanelProps) {
    if (status === 'idle') return null;

    return (
        <Card className="mt-8 border-t-4 border-t-primary shadow-lg animate-in fade-in slide-in-from-bottom-4">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-muted-foreground" />
                    Execution Result
                </CardTitle>
                <div className="flex items-center gap-2">
                    {status === 'running' && (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-200 animate-pulse">
                            <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                            Running...
                        </Badge>
                    )}
                    {status === 'success' && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Success
                        </Badge>
                    )}
                    {status === 'failed' && (
                        <Badge variant="destructive" className="bg-red-500/10 text-red-600 border-red-200">
                            <XCircle className="w-3 h-3 mr-1" />
                            Failed
                        </Badge>
                    )}
                    {executionTime && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {(executionTime / 1000).toFixed(2)}s
                        </span>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[300px] w-full rounded-md border bg-muted/50 p-4">
                    {status === 'running' && (
                        <div className="flex flex-col items-center justify-center h-full space-y-4 text-muted-foreground">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <p className="text-sm">Agent is thinking...</p>
                        </div>
                    )}

                    {status === 'failed' && (
                        <div className="text-red-500 font-mono text-sm whitespace-pre-wrap">
                            Error: {error || "Unknown error occurred"}
                        </div>
                    )}

                    {status === 'success' && result !== null && result !== undefined && (
                        <div className="prose dark:prose-invert max-w-none text-sm">
                            {/* Check if result is text or object */}
                            {typeof result === 'object' && result !== null && 'text' in result && typeof (result as Record<string, unknown>).text === 'string' ? (
                                <ReactMarkdown>{String((result as Record<string, unknown>).text)}</ReactMarkdown>
                            ) : (
                                <pre className="font-mono text-xs overflow-auto">
                                    {JSON.stringify(result, null, 2)}
                                </pre>
                            )}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
