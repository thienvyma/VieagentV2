"use client";

import { useState } from "react";
import { addCredential } from "@/app/[locale]/dashboard/credentials/actions";
import { Button } from "@/components/core/ui/button";
import { Input } from "@/components/core/ui/input";
import { Label } from "@/components/core/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/core/ui/select"
import { Loader2, CheckCircle2, XCircle, Zap } from "lucide-react";
import { toast } from "sonner";

type TestStatus = 'idle' | 'testing' | 'valid' | 'invalid';

export function AddCredentialForm() {
    const [isLoading, setIsLoading] = useState(false);
    const [testStatus, setTestStatus] = useState<TestStatus>('idle');
    const [provider, setProvider] = useState<string>('');
    const [apiKey, setApiKey] = useState<string>('');

    async function handleTest() {
        if (!provider || !apiKey) {
            toast.error("Please select a provider and enter an API key");
            return;
        }

        setTestStatus('testing');

        try {
            const response = await fetch('/api/credentials/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider, api_key: apiKey }),
            });

            const result = await response.json();

            if (result.success) {
                setTestStatus('valid');
                toast.success(result.message || "API key is valid!");
            } else {
                setTestStatus('invalid');
                toast.error(result.error || "Invalid API key");
            }
        } catch {
            setTestStatus('invalid');
            toast.error("Failed to test connection");
        }
    }

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        const res = await addCredential(formData);
        setIsLoading(false);

        if (res?.error) {
            toast.error(res.error);
        } else {
            toast.success("Credential saved successfully!");
            // Reset form
            const form = document.getElementById("add-cred-form") as HTMLFormElement;
            form?.reset();
            setTestStatus('idle');
            setProvider('');
            setApiKey('');
        }
    }

    return (
        <form id="add-cred-form" action={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="provider">Provider</Label>
                <Select
                    name="provider"
                    required
                    value={provider}
                    onValueChange={(val) => {
                        setProvider(val);
                        setTestStatus('idle');
                    }}
                >
                    <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="gemini">Google Gemini</SelectItem>
                        <SelectItem value="anthropic">Anthropic</SelectItem>
                        <SelectItem value="deepseek">DeepSeek</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="keyName">Name (Alias)</Label>
                <Input id="keyName" name="keyName" placeholder="My Pro Key" required />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="apiKey">API Key</Label>
                <div className="flex gap-2">
                    <Input
                        id="apiKey"
                        name="apiKey"
                        type="password"
                        placeholder="sk-..."
                        required
                        value={apiKey}
                        onChange={(e) => {
                            setApiKey(e.target.value);
                            setTestStatus('idle');
                        }}
                        className="flex-1"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleTest}
                        disabled={testStatus === 'testing' || !provider || !apiKey}
                        className="shrink-0"
                    >
                        {testStatus === 'testing' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {testStatus === 'valid' && <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />}
                        {testStatus === 'invalid' && <XCircle className="mr-2 h-4 w-4 text-red-500" />}
                        {testStatus === 'idle' && <Zap className="mr-2 h-4 w-4" />}
                        Test
                    </Button>
                </div>
                {testStatus === 'valid' && (
                    <p className="text-sm text-green-600 dark:text-green-400">
                        ✓ Connection verified
                    </p>
                )}
                {testStatus === 'invalid' && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                        ✗ Invalid key - please check and try again
                    </p>
                )}
            </div>
            <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Encrypt & Save
            </Button>
        </form>
    );
}
