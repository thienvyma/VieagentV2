import { createClient } from "@/utils/supabase/server";
import { DynamicForm } from "@/components/business/forms/dynamic-form";
import { CredentialOption } from "@/components/business/forms/credential-select";
import { AgentInputSchema } from "@/types/engine";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/core/ui/card";

export default async function TestFormPage() {
    const supabase = await createClient();
    const { data: credentialsRaw } = await supabase
        .from("credentials")
        .select("id, key_name, provider");

    // Cast to proper type
    const credentials = (credentialsRaw || []) as unknown as CredentialOption[];

    // Sample Schema for "News Summarizer"
    const testSchema: AgentInputSchema = {
        fields: [
            {
                name: "article_url",
                label: "Article Link",
                type: "text",
                placeholder: "https://example.com/news",
                required: true,
                description: "The URL of the article you want to summarize.",
            },
            {
                name: "output_language",
                label: "Output Language",
                type: "select",
                required: true,
                defaultValue: "vi",
                options: [
                    { label: "Vietnamese", value: "vi" },
                    { label: "English", value: "en" },
                    { label: "Japanese", value: "ja" }
                ]
            },
            {
                name: "detail_level",
                label: "Summary Detail",
                type: "number",
                placeholder: "1-100",
                description: "Percentage of original length (approx)."
            },
            {
                name: "openai_key",
                label: "OpenAI Key",
                type: "credential",
                required: true,
                description: "We need this to power the LLM."
            }
        ],
    };

    async function mockSubmit(data: Record<string, unknown>): Promise<void> {
        "use server";
        console.log("SERVER ACTION RECEIVED FORM DATA:", data);
        // In real life, we would call Flowise API here
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Form Engine Test</h1>
                <p className="text-muted-foreground">
                    Verifying Phase 2: Dynamic Input Mapping & Credential Injection.
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>News Summarizer (Mock)</CardTitle>
                    <CardDescription>
                        This form is generated entirely from JSON.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <DynamicForm
                        schema={testSchema}
                        credentials={credentials || []}
                        onSubmit={mockSubmit}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
