export interface Agent {
    id: string;
    name: string;
    description: string;
    long_description?: string; // Full markdown description
    price: number; // in cents (0 = free)
    price_monthly?: number; // For subscription pricing
    status: "draft" | "published" | "pending";
    category: string;
    cover_image?: string;
    developer_id: string;
    created_at: string;
    updated_at?: string;
    input_schema?: Record<string, unknown>; // JSON schema for Form Engine
    engine_type?: "flowise" | "activepieces";
    engine_flow_id?: string;
    required_credential_types?: string[]; // e.g., ["openai", "gemini"]
    features?: string[]; // Feature bullet points
    complexity?: "beginner" | "intermediate" | "advanced";
    execution_count?: number;
    rating?: number; // 1-5
    review_count?: number;
}
