"use client";

import { useState } from "react";
import { DynamicForm } from "@/components/business/forms/dynamic-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/core/ui/card";
import { Agent } from "@/types/agent";
import { AgentInputSchema } from "@/types/engine";
import { ExecutionStatusPanel } from "@/components/business/execution/execution-status-panel";
import { toast } from "sonner";
import { executeAgent } from "@/lib/actions/execution";
import { Credential, ExecutionStatus } from "@/types/execution";

interface RunAgentViewProps {
    agent: Agent;
    credentials: Credential[];
}

export function RunAgentView({ agent, credentials }: RunAgentViewProps) {
    const [status, setStatus] = useState<ExecutionStatus>('idle');
    const [result, setResult] = useState<unknown>(null);
    const [error, setError] = useState<string | undefined>(undefined);
    const [executionTime, setExecutionTime] = useState<number>(0);

    async function handleExecute(formData: Record<string, unknown>) {
        setStatus('running');
        setResult(null);
        setError(undefined);

        const inputs: Record<string, unknown> = {};
        const credential_ids: Record<string, string> = {};

        // Helper to find field type in schema
        // We cast agent.input_schema to any temporarily because standard Agent type might define it loosely as Json
        // In a strict refactor, Agent type should be improved, but 'unknown' assertion is safer than 'any'
        const schema = agent.input_schema as unknown as AgentInputSchema;

        Object.entries(formData).forEach(([key, value]) => {
            const field = schema?.fields?.find((f) => f.name === key);
            if (field?.type === 'credential') {
                credential_ids[key] = String(value);
            } else {
                inputs[key] = value;
            }
        });

        try {
            const startTime = Date.now();

            // Call Server Action
            const response = await executeAgent(agent.id, { inputs, credential_ids });

            const duration = Date.now() - startTime;
            setExecutionTime(duration);

            if (!response.success || !response.data) {
                setStatus('failed');
                setError(response.error || "Execution failed");
                toast.error("Execution failed: " + (response.error || "Unknown error"));
            } else {
                setStatus('success');
                setResult(response.data.data);
                toast.success("Agent finished successfully!");
            }
        } catch (err: unknown) {
            setStatus('failed');
            const errorMessage = err instanceof Error ? err.message : "Network error";
            setError(errorMessage);
            toast.error(errorMessage);
        }
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
                                    schema={agent.input_schema as unknown as AgentInputSchema}
                                    credentials={credentials}
                                    onSubmit={handleExecute}
                                />
                            ) : (
                                <div className="p-4 text-center text-muted-foreground bg-muted rounded">
                                    No inputs configured for this agent.
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Result Panel */}
                    <ExecutionStatusPanel
                        status={status}
                        result={result}
                        error={error}
                        executionTime={executionTime}
                    />
                </div>

                <div className="md:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Execution History</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">History feature coming soon...</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
