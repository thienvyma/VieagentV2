import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// Provider-specific test functions
async function testOpenAI(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
        const response = await fetch("https://api.openai.com/v1/models", {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
            },
        });

        if (response.ok) {
            return { valid: true };
        }

        const error = await response.json();
        return {
            valid: false,
            error: error.error?.message || `HTTP ${response.status}`
        };
    } catch (err) {
        return {
            valid: false,
            error: err instanceof Error ? err.message : "Connection failed"
        };
    }
}

async function testGemini(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
        // Test by listing models
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
        );

        if (response.ok) {
            return { valid: true };
        }

        const error = await response.json();
        return {
            valid: false,
            error: error.error?.message || `HTTP ${response.status}`
        };
    } catch (err) {
        return {
            valid: false,
            error: err instanceof Error ? err.message : "Connection failed"
        };
    }
}

async function testAnthropic(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
        // Anthropic requires a message to test, but we can check auth with minimal request
        const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
                "x-api-key": apiKey,
                "anthropic-version": "2023-06-01",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "claude-3-haiku-20240307",
                max_tokens: 1,
                messages: [{ role: "user", content: "test" }],
            }),
        });

        // 200 = valid, 401 = invalid key
        if (response.ok) {
            return { valid: true };
        }

        const error = await response.json();

        // Handle rate limit as valid (key works but rate limited)
        if (response.status === 429) {
            return { valid: true };
        }

        return {
            valid: false,
            error: error.error?.message || `HTTP ${response.status}`
        };
    } catch (err) {
        return {
            valid: false,
            error: err instanceof Error ? err.message : "Connection failed"
        };
    }
}

async function testDeepSeek(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
        const response = await fetch("https://api.deepseek.com/v1/models", {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
            },
        });

        if (response.ok) {
            return { valid: true };
        }

        const error = await response.json();
        return {
            valid: false,
            error: error.error?.message || `HTTP ${response.status}`
        };
    } catch (err) {
        return {
            valid: false,
            error: err instanceof Error ? err.message : "Connection failed"
        };
    }
}

export async function POST(req: NextRequest) {
    // Auth check
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        return NextResponse.json(
            { success: false, error: "Unauthorized" },
            { status: 401 }
        );
    }

    try {
        const { provider, api_key } = await req.json();

        if (!provider || !api_key) {
            return NextResponse.json(
                { success: false, error: "Missing provider or api_key" },
                { status: 400 }
            );
        }

        let result: { valid: boolean; error?: string };

        switch (provider.toLowerCase()) {
            case "openai":
                result = await testOpenAI(api_key);
                break;
            case "google":
            case "gemini":
                result = await testGemini(api_key);
                break;
            case "anthropic":
            case "claude":
                result = await testAnthropic(api_key);
                break;
            case "deepseek":
                result = await testDeepSeek(api_key);
                break;
            default:
                // For unknown providers, we can't test - assume valid
                result = { valid: true };
        }

        if (result.valid) {
            return NextResponse.json({
                success: true,
                message: `${provider} API key is valid`,
            });
        } else {
            return NextResponse.json({
                success: false,
                error: result.error || "Invalid API key",
            });
        }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        console.error("[Credential Test Error]:", errorMessage);
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}
