"use server";

import { createClient } from "@/utils/supabase/server";
import { encrypt } from "@/lib/encryption";
import { revalidatePath } from "next/cache";

export async function addCredential(formData: FormData) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    const provider = formData.get("provider") as string;
    const keyName = formData.get("keyName") as string;
    const apiKey = formData.get("apiKey") as string;

    if (!provider || !keyName || !apiKey) {
        return { error: "Missing fields" };
    }

    try {
        const { iv, encryptedData } = encrypt(apiKey);

        const { error } = await supabase.from("credentials").insert({
            user_id: user.id,
            provider,
            key_name: keyName,
            encrypted_value: encryptedData,
            iv,
        });

        if (error) {
            console.error("Database Error:", error)
            return { error: "Failed to save credential" };
        }

        revalidatePath("/dashboard/credentials");
        return { success: true };
    } catch (err) {
        console.error("Encryption Error:", err);
        return { error: "Internal Server Error" };
    }
}

export async function deleteCredential(id: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    const { error } = await supabase
        .from("credentials")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) {
        return { error: "Failed to delete" };
    }

    revalidatePath("/dashboard/credentials");
    return { success: true };
}
