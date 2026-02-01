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
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function AddCredentialForm() {
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(formData: FormData) {
        setIsLoading(true);
        const res = await addCredential(formData);
        setIsLoading(false);

        if (res?.error) {
            toast.error(res.error);
        } else {
            toast.success("Credential saved successfully!");
            // Reset form manually or use ref
            const form = document.getElementById("add-cred-form") as HTMLFormElement;
            form?.reset();
        }
    }

    return (
        <form id="add-cred-form" action={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="provider">Provider</Label>
                <Select name="provider" required>
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
                <Input id="apiKey" name="apiKey" type="password" placeholder="sk-..." required />
            </div>
            <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Encrypt & Save
            </Button>
        </form>
    );
}
