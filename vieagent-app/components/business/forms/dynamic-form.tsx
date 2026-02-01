"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/core/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/core/ui/form";
import { Input } from "@/components/core/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/core/ui/select";
import { Textarea } from "@/components/core/ui/textarea";
import { Switch } from "@/components/core/ui/switch";


import { CredentialSelect, CredentialOption } from "./credential-select";
import type { AgentInputSchema, FormInputField } from "@/types/engine";

interface DynamicFormProps {
    schema: AgentInputSchema;
    credentials?: CredentialOption[]; // Passed from server
    onSubmit: (data: Record<string, unknown>) => Promise<void>;
}

// Helper to generate Zod schema from JSON schema
function generateZodSchema(fields: FormInputField[]) {
    const shape: Record<string, z.ZodTypeAny> = {};

    fields.forEach((field) => {
        let validator;

        switch (field.type) {
            case "text":
            case "textarea":
            case "select":
            case "credential": // Credential ID is a string (UUID)
                validator = z.string();
                if (field.required) {
                    validator = validator.min(1, { message: `${field.label} is required` });
                } else {
                    validator = validator.optional();
                }
                break;
            case "number":
                validator = z.coerce.number(); // Coerce string input to number
                if (field.required) {
                    // number validation usually implies not NaN
                } else {
                    validator = validator.optional();
                }
                break;
            case "switch":
                validator = z.boolean();
                if (!field.required) validator = validator.optional();
                break;
            default:
                validator = z.string().optional();
        }

        // Set default value logic if needed, but react-hook-form handles defaults via defaultValues prop better.
        shape[field.name] = validator;
    });

    return z.object(shape);
}

export function DynamicForm({ schema, credentials = [], onSubmit }: DynamicFormProps) {
    const [isLoading, setIsLoading] = useState(false);

    // Memoize validation schema so it doesn't rebuild on every render
    const formSchema = useMemo(() => generateZodSchema(schema.fields), [schema]);

    // Initial values
    const defaultValues = useMemo(() => {
        const defaults: Record<string, unknown> = {};
        schema.fields.forEach(f => {
            if (f.defaultValue !== undefined) defaults[f.name] = f.defaultValue;
        });
        return defaults;
    }, [schema]);

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues,
    });

    async function handleSubmit(data: Record<string, unknown>) {
        setIsLoading(true);
        try {
            await onSubmit(data);
        } catch (error) {
            console.error("Form submission error", error);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {schema.fields.map((field) => (
                    <FormField
                        key={field.name}
                        control={form.control}
                        name={field.name}
                        render={({ field: formField }) => {
                            if (field.hidden) return <input type="hidden" {...formField} value={formField.value?.toString() ?? ""} />;

                            return (
                                <FormItem>
                                    {field.type !== "credential" && (
                                        <FormLabel>
                                            {field.label} {field.required && <span className="text-destructive">*</span>}
                                        </FormLabel>
                                    )}

                                    <FormControl>
                                        {/* RENDER INPUT BASED ON TYPE */}
                                        {field.type === "text" && (
                                            <Input
                                                placeholder={field.placeholder}
                                                {...formField}
                                                value={formField.value == null ? "" : String(formField.value)}
                                            />
                                        )}

                                        {field.type === "number" && (
                                            <Input
                                                type="number"
                                                placeholder={field.placeholder}
                                                {...formField}
                                                value={formField.value == null ? "" : Number(formField.value)}
                                                onChange={(e) => formField.onChange(e.target.valueAsNumber)} // Handle number conversion
                                            />
                                        )}

                                        {field.type === "select" && (
                                            <Select onValueChange={formField.onChange} defaultValue={formField.value ? String(formField.value) : undefined}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder={field.placeholder || "Select option"} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {field.options?.map((opt) => (
                                                        <SelectItem key={opt.value} value={String(opt.value)}>
                                                            {opt.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}

                                        {field.type === "switch" && (
                                            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                <div className="space-y-0.5">
                                                    <FormLabel className="text-base">{field.label}</FormLabel>
                                                    {field.description && <FormDescription>{field.description}</FormDescription>}
                                                </div>
                                                <FormControl>
                                                    <Switch
                                                        checked={Boolean(formField.value)}
                                                        onCheckedChange={formField.onChange}
                                                    />
                                                </FormControl>
                                            </div>
                                        )}

                                        {field.type === "credential" && (
                                            <CredentialSelect
                                                field={formField}
                                                credentials={credentials}
                                                label={field.label}
                                                description={field.description}
                                            />
                                        )}

                                        {(field.type === "textarea") && (
                                            <Textarea
                                                placeholder={field.placeholder}
                                                {...formField}
                                                value={formField.value?.toString() ?? ""}
                                            />
                                        )}
                                    </FormControl>

                                    {field.description && field.type !== "credential" && (
                                        <FormDescription>{field.description}</FormDescription>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            );
                        }}
                    />
                ))}

                <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Run Agent
                </Button>
            </form>
        </Form>
    );
}
