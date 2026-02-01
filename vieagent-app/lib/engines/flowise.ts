import { ActionResponse } from "@/types/actions";
import { FlowisePredictionPayload, FlowisePredictionResponse } from "@/types/engine";

/**
 * Configuration structure for Flowise
 */
interface FlowiseConfig {
    baseUrl: string;
    apiKey?: string;
}

export class FlowiseClient {
    private baseUrl: string;
    private apiKey?: string;

    constructor(config: FlowiseConfig) {
        this.baseUrl = config.baseUrl.replace(/\/$/, ""); // Remove trailing slash
        this.apiKey = config.apiKey;
    }

    /**
     * Executes a workflow on Flowise
     * Supports credential injection via overrideConfig
     */
    async executeWorkflow(
        chatflowId: string,
        payload: FlowisePredictionPayload
    ): Promise<ActionResponse<FlowisePredictionResponse | ReadableStream>> {
        try {
            const url = `${this.baseUrl}/api/v1/prediction/${chatflowId}`;

            const headers: HeadersInit = {
                "Content-Type": "application/json",
            };

            if (this.apiKey) {
                headers["Authorization"] = `Bearer ${this.apiKey}`;
            }

            const response = await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Flowise Error (${response.status}): ${errorText}`);
            }

            // Handle Streaming Response
            if (payload.streaming && response.body) {
                return {
                    success: true,
                    data: response.body
                }
            }

            // Handle JSON Response
            const data = (await response.json()) as FlowisePredictionResponse;
            return {
                success: true,
                data: data,
            };

        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : "Failed to execute workflow in Flowise";
            console.error("[Flowise Execution Error]:", message);
            return {
                success: false,
                error: message,
            };
        }
    }

    /**
     * Checks if Flowise is reachable
     */
    async healthCheck(): Promise<boolean> {
        try {
            // Usually Flowise has a health check or we can try listing flows (if admin key provided)
            // Or just a simple GET to root
            const response = await fetch(`${this.baseUrl}/api/v1/version`, {
                headers: this.apiKey ? { "Authorization": `Bearer ${this.apiKey}` } : {}
            });
            return response.ok;
        } catch {
            return false;
        }
    }
}
