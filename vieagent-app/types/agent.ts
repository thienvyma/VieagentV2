export interface Agent {
    id: string;
    name: string;
    description: string;
    price: number; // in cents
    status: "draft" | "published" | "pending";
    category: string;
    cover_image?: string;
    developer_id: string;
    created_at: string;
    input_schema?: any; // JSON schema for Form Engine
}
