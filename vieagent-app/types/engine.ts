export type FormInputType =
    | "text"
    | "number"
    | "select"
    | "switch"
    | "textarea"
    | "credential"; // Special V2 type for Vault integration

export interface FormInputOption {
    label: string;
    value: string | number;
}

export interface FormInputField {
    name: string; // The variable name passed to Flowise (e.g., "URL", "Tone")
    label: string; // User-facing label
    type: FormInputType;
    required?: boolean;
    placeholder?: string;
    description?: string; // Helper text
    defaultValue?: string | number | boolean;
    options?: FormInputOption[]; // Only for 'select'
    hidden?: boolean; // For passing static context (e.g., Language=vi)
}

export interface AgentInputSchema {
    fields: FormInputField[];
}

export interface WorkflowExecutionPayload {
    agentId?: string;
    workflowId?: string;
    inputs: Record<string, any>;
}
