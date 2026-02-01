"use client";


import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/core/ui/button";
import { Input } from "@/components/core/ui/input";
import { Textarea } from "@/components/core/ui/textarea";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/core/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/core/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/core/ui/card";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";

// Schema
const agentFormSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters."),
    description: z.string().min(10, "Description must be at least 10 characters."),
    category: z.string().min(1, "Category is required."),
    price: z.coerce.number().min(0, "Price cannot be negative.").default(0),
    engine: z.enum(["flowise", "activepieces"]),
    engine_id: z.string().min(1, "Engine ID is required."),
    input_schema: z.string().refine((val) => {
        try {
            JSON.parse(val);
            return true;
        } catch {
            return false;
        }
    }, "Invalid JSON format."),
    status: z.enum(["draft", "published"]),
    cover_image: z.string().url().optional().or(z.literal("")),
});

type AgentFormValues = z.infer<typeof agentFormSchema>;



import { Agent } from "@/types/agent";

export function AgentEditor({ initialData }: { initialData?: Agent }) {
    const router = useRouter();

    const formattedDefaultValues: AgentFormValues = initialData ? {
        name: initialData.name,
        description: initialData.description,
        category: initialData.category,
        price: initialData.price,
        status: (initialData.status === "pending" ? "draft" : initialData.status) as "draft" | "published",
        cover_image: initialData.cover_image || "",
        engine: (initialData.engine_type || "flowise") as "flowise" | "activepieces",
        engine_id: initialData.engine_flow_id || "",
        input_schema: initialData.input_schema ? JSON.stringify(initialData.input_schema, null, 2) : "{}",
    } : {
        name: "",
        description: "",
        category: "",
        price: 0,
        status: "draft",
        cover_image: "",
        engine: "flowise",
        engine_id: "",
        input_schema: "[]",
    };

    const form = useForm<AgentFormValues>({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resolver: zodResolver(agentFormSchema) as any,
        defaultValues: formattedDefaultValues,
    });

    async function onSubmit(data: AgentFormValues) {
        const supabase = createClient();

        // Map form values back to DB columns
        const payload = {
            name: data.name,
            description: data.description,
            category: data.category,
            price: data.price,
            status: data.status,
            cover_image: data.cover_image,
            engine_type: data.engine,         // Map engine -> engine_type
            engine_flow_id: data.engine_id,   // Map engine_id -> engine_flow_id
            input_schema: JSON.parse(data.input_schema) as Record<string, unknown>,
            updated_at: new Date().toISOString(),
        };

        let error;

        if (initialData?.id) {
            // Update
            const res = await supabase.from("agents").update(payload).eq("id", initialData.id);
            error = res.error;
        } else {
            // Create
            const res = await supabase.from("agents").insert([payload]);
            error = res.error;
        }

        if (error) {
            toast.error("Failed to save agent: " + error.message);
        } else {
            toast.success("Agent saved successfully.");
            router.push("/dashboard/admin/agents");
            router.refresh();
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left Column: Basic Info */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Basic Information</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl><Input placeholder="Agent Name" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Description</FormLabel>
                                            <FormControl><Textarea placeholder="What does this agent do?" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Category</FormLabel>
                                            <FormControl><Input placeholder="e.g. Marketing" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="price"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Price (Cents)</FormLabel>
                                                <FormControl><Input type="number" {...field} /></FormControl>
                                                <FormDescription>$10.00 = 1000</FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Status</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="draft">Draft</SelectItem>
                                                        <SelectItem value="published">Published</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Engine & config */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader><CardTitle>Engine Configuration</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="engine"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Engine</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger><SelectValue placeholder="Engine" /></SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="flowise">Flowise</SelectItem>
                                                        <SelectItem value="activepieces">ActivePieces</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="engine_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Chatflow ID</FormLabel>
                                                <FormControl><Input {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="input_schema"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Input Schema (JSON)</FormLabel>
                                            <FormControl>
                                                <Textarea className="font-mono text-xs" rows={10} {...field} />
                                            </FormControl>
                                            <FormDescription>
                                                Defines the UI form. e.g. JSON array of fields.
                                            </FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
                    <Button type="submit">Save Agent</Button>
                </div>
            </form>
        </Form>
    );
}
