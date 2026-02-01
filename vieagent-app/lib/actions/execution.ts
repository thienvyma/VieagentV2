"use server";

import { createClient } from "@/utils/supabase/server";
import { FlowiseClient } from "@/lib/engines/flowise";
import { decrypt } from "@/lib/encryption";
import { ActionResponse } from "@/types/actions";
import { ExecutionInput, ExecutionResult } from "@/types/execution";
import { randomUUID } from "crypto";

// Initialize Flowise Client
const flowise = new FlowiseClient({
    baseUrl: process.env.FLOWISE_API_URL || "http://localhost:3000",
    apiKey: process.env.FLOWISE_API_KEY
});

export async function executeAgent(
    agentId: string,
    payload: ExecutionInput
): Promise<ActionResponse<ExecutionResult>> {

    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const { inputs, credential_ids } = payload;

        // 1. Fetch Agent Config
        const { data: agent, error: agentError } = await supabase
            .from("agents")
            .select("id, engine_flow_id, required_credential_types, engine_type")
            .eq("id", agentId)
            .single();

        if (agentError || !agent) {
            return { success: false, error: "Agent not found" };
        }

        if (agent.engine_type !== 'flowise' || !agent.engine_flow_id) {
            return { success: false, error: "Invalid agent configuration" };
        }

        // 2. Prepare Credentials
        const overrideConfig: Record<string, string> = {};

        if (agent.required_credential_types && agent.required_credential_types.length > 0) {
            if (!credential_ids) {
                return { success: false, error: "Missing credentials" };
            }

            const credentialIdsValues = Object.values(credential_ids);

            if (credentialIdsValues.length > 0) {
                const { data: credentials, error: credError } = await supabase
                    .from("credentials")
                    .select("id, provider, encrypted_value, iv, key_name")
                    .eq("user_id", user.id)
                    .in("id", credentialIdsValues);

                if (credError) throw new Error("Failed to fetch credentials");

                if (credentials) {
                    credentials.forEach(cred => {
                        const decryptedKey = decrypt(cred.encrypted_value, cred.iv);
                        // Mapping strategy for standard providers
                        // Ensure we type check provider strings if possible, or leave as string
                        if (cred.provider === 'openai') overrideConfig['openAIApiKey'] = decryptedKey;
                        else if (cred.provider === 'anthropic') overrideConfig['anthropicApiKey'] = decryptedKey;
                        else if (cred.provider === 'google') overrideConfig['googleGeminiAPIKey'] = decryptedKey;
                        else if (cred.provider === 'gemini') overrideConfig['googleGeminiAPIKey'] = decryptedKey;
                        else if (cred.provider === 'pinecone') overrideConfig['pineconeApiKey'] = decryptedKey;
                    });
                }
            }
        }

        // 3. Prepare Logic inputs
        // 'question' is a reserved key in Flowise for the main prompt
        const question = String(inputs['question'] || inputs['prompt'] || "Start");

        // Remove question/prompt from inputs to avoid duplication if needed, 
        // but Flowise usually handles extra keys in overrideConfig fine.
        const flowInputs: Record<string, unknown> = { ...inputs };
        delete flowInputs['question'];

        // 4. Create Pending Execution Log (workflow_executions)
        const { data: logEntry, error: logError } = await supabase
            .from("workflow_executions")
            .insert({
                user_id: user.id,
                agent_id: agent.id,
                status: "running",
                input_snapshot: { inputs, credential_ids_used: Object.keys(credential_ids || {}) },
                started_at: new Date().toISOString()
            })
            .select()
            .single();

        if (logError) throw new Error("Failed to create execution log");

        // 5. Execute via Flowise with Session Isolation
        const start = Date.now();
        // GENERATE UNIQUE SESSION ID FOR STATELESS EXECUTION (Risk 2 Mitigation)
        const sessionId = randomUUID();

        const executionResult = await flowise.executeWorkflow(agent.engine_flow_id, {
            question,
            overrideConfig: {
                ...overrideConfig,
                ...flowInputs as Record<string, string>
            },
            sessionId: sessionId
        });

        const duration = Date.now() - start;

        // 6. Update Log
        if (executionResult.success && executionResult.data && !(executionResult.data instanceof ReadableStream)) {
            await supabase
                .from("workflow_executions")
                .update({
                    status: "success",
                    output_snapshot: executionResult.data as unknown as Record<string, unknown>,
                    duration_ms: duration,
                    completed_at: new Date().toISOString()
                })
                .eq("id", logEntry.id);

            return {
                success: true,
                data: {
                    execution_id: logEntry.id,
                    status: 'success',
                    data: executionResult.data
                }
            };
        } else {
            await supabase
                .from("workflow_executions")
                .update({
                    status: "failed",
                    error_message: executionResult.error || "Internal error",
                    duration_ms: duration,
                    completed_at: new Date().toISOString()
                })
                .eq("id", logEntry.id);

            return {
                success: false,
                error: executionResult.error || "Execution failed"
            };
        }

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Internal error";
        console.error("Execute Action Error:", message);
        return { success: false, error: message };
    }
}
