"use client";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/core/ui/select";
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/core/ui/form";
import { Credential } from "@/types/execution";
import { ControllerRenderProps } from "react-hook-form";

// Re-export Credential as CredentialOption for form consumers
export type CredentialOption = Credential;

interface CredentialSelectProps {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    field: ControllerRenderProps<any, any>;
    credentials: Credential[];
    label: string;
    description?: string;
    providerFilter?: string; // e.g. "openai" to only show OpenAI keys
}

export function CredentialSelect({
    field,
    credentials,
    label,
    description,
    providerFilter,
}: CredentialSelectProps) {
    // Filter credentials if a provider constraint is given
    const filteredCreds = providerFilter
        ? credentials.filter(c => c.provider.toLowerCase() === providerFilter.toLowerCase())
        : credentials;

    return (
        <FormItem>
            <FormLabel>{label}</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a credential key" />
                    </SelectTrigger>
                </FormControl>
                <SelectContent>
                    {filteredCreds.length === 0 ? (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                            No keys found. Please add one in Vault.
                        </div>
                    ) : (
                        filteredCreds.map((cred) => (
                            <SelectItem key={cred.id} value={cred.id}>
                                {cred.key_name} <span className="text-xs text-muted-foreground">({cred.provider})</span>
                            </SelectItem>
                        ))
                    )}
                </SelectContent>
            </Select>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
            <FormMessage />
        </FormItem>
    );
}
