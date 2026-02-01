/**
 * Strict types for Execution domain to comply with project rules
 */

export interface Credential {
    id: string;
    key_name: string | null;
    provider: string;
}

export type ExecutionStatus = 'idle' | 'running' | 'success' | 'failed';

export interface ExecutionResult {
    execution_id?: string;
    status: ExecutionStatus;
    data?: unknown;
    error?: string;
}

export interface ExecutionInput {
    inputs: Record<string, unknown>;
    credential_ids: Record<string, string>;
}
