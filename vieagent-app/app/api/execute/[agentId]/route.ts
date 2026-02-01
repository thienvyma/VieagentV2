import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { FlowiseClient } from "@/lib/engines/flowise";
import { decrypt } from "@/lib/encryption";

// Initialize Flowise Client
// process.env.FLOWISE_API_URL should be set in .env
const flowise = new FlowiseClient({
    baseUrl: process.env.FLOWISE_API_URL || "http://localhost:3000",
    apiKey: process.env.FLOWISE_API_KEY
});

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ agentId: string }> }
) {
    const { agentId } = await context.params;

    // 1. Auth Check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { inputs, credential_ids } = body; // credential_ids: { "openai": "uuid-...", "google": "uuid-..." }

        // 2. Fetch Agent Config
        const { data: agent, error: agentError } = await supabase
            .from("agents")
            .select("id, engine_flow_id, required_credential_types, engine_type")
            .eq("id", agentId)
            .single();

        if (agentError || !agent) {
            return NextResponse.json({ success: false, error: "Agent not found" }, { status: 404 });
        }

        if (agent.engine_type !== 'flowise' || !agent.engine_flow_id) {
            return NextResponse.json({ success: false, error: "Invalid agent configuration" }, { status: 400 });
        }

        // 3. Prepare Credentials (The "Secure Injection" part)
        const overrideConfig: Record<string, unknown> = {};

        // If agent requires credentials, fetch and decrypt them
        if (agent.required_credential_types && agent.required_credential_types.length > 0) {
            if (!credential_ids) {
                return NextResponse.json({
                    success: false,
                    error: `Missing credentials. Required: ${agent.required_credential_types.join(", ")}`
                }, { status: 400 });
            }

            // Fetch actual encrypted credentials from Vault
            // Security: We only fetch credentials belonging to THIS user
            const credentialIdsValues = Object.values(credential_ids) as string[];

            if (credentialIdsValues.length > 0) {
                const { data: credentials, error: credError } = await supabase
                    .from("credentials")
                    .select("id, provider, encrypted_value, iv, key_name")
                    .eq("user_id", user.id)
                    .in("id", credentialIdsValues);

                if (credError) {
                    throw new Error("Failed to fetch credentials");
                }

                // Decrypt and map to Flowise Override Config
                // Convention: We map Provider Name -> Variable Name in Flowise?
                // OR we map key_name ?? 
                // STANDARD PATTERN: We mostly inject "openAIApiKey", "googleGeminiAPIKey" etc.
                // Depending on the Provider Type.
                // For now, let's assume a mapping based on provider type.

                credentials.forEach(cred => {
                    // Decrypt securely
                    const decryptedKey = decrypt(cred.encrypted_value, cred.iv);

                    // Simple mapping strategy for MVP
                    // Enhancements: Admin defines mapping in Agent configuration
                    if (cred.provider === 'openai') {
                        overrideConfig['openAIApiKey'] = decryptedKey;
                    } else if (cred.provider === 'anthropic') {
                        overrideConfig['anthropicApiKey'] = decryptedKey;
                    } else if (cred.provider === 'google') {
                        overrideConfig['googleGeminiAPIKey'] = decryptedKey;
                    } else if (cred.provider === 'pinecone') {
                        overrideConfig['pineconeApiKey'] = decryptedKey;
                    }
                    // Add more mappings as needed
                });
            }
        }

        // Merge user inputs into overrideConfig or Question
        // If the flow expects strict variables, they often go into overrideConfig too
        // or passed as 'question' (if it's a simple chat)
        // For Flowise, inputs usually go into 'overrideConfig' if they are variables
        // OR 'question' if it's the main chat input.

        // Strategy: 
        // 1. 'question' input is special -> goes to 'question'
        // 2. All other inputs -> merge into overrideConfig

        const question = inputs['question'] || inputs['prompt'] || "Start";
        const flowInputs = { ...inputs };
        delete flowInputs['question'];

        const finalOverrideConfig = {
            ...overrideConfig,
            ...flowInputs
        };

        // 4. Create Pending Execution Log (workflow_executions)
        const { data: logEntry, error: logError } = await supabase
            .from("workflow_executions")
            .insert({
                user_id: user.id,
                agent_id: agent.id,
                status: "running", // Set running immediately
                input_snapshot: { inputs, credential_ids_used: Object.keys(credential_ids || {}) },
                started_at: new Date().toISOString()
            })
            .select()
            .single();

        if (logError) {
            throw new Error("Failed to create execution log: " + logError.message);
        }

        // 5. Call Flowise
        const start = Date.now();
        const executionResult = await flowise.executeWorkflow(agent.engine_flow_id, {
            question: String(question),
            overrideConfig: finalOverrideConfig,
            history: [] // Stateless for now
        });

        const duration = Date.now() - start;

        // 6. Update Log with Result
        if (executionResult.success) {
            await supabase
                .from("workflow_executions")
                .update({
                    status: "success",
                    output_snapshot: executionResult.data as Record<string, unknown>,
                    duration_ms: duration,
                    completed_at: new Date().toISOString()
                })
                .eq("id", logEntry.id);

            return NextResponse.json({
                success: true,
                execution_id: logEntry.id,
                status: "success",
                data: executionResult.data
            });
        } else {
            await supabase
                .from("workflow_executions")
                .update({
                    status: "failed",
                    error_message: executionResult.error,
                    duration_ms: duration,
                    completed_at: new Date().toISOString()
                })
                .eq("id", logEntry.id);

            return NextResponse.json({
                success: false,
                execution_id: logEntry.id,
                status: "failed",
                error: executionResult.error
            }, { status: 500 });
        }

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("[Execution API Error]:", errorMessage);
        return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
    }
}
