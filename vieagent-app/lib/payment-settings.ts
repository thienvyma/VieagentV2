"use server";

import { createClient } from "@/utils/supabase/server";
import { revalidatePath } from "next/cache";

export interface PaymentSettings {
    bank_name: string;
    bank_account_num: string;
    bank_account_name: string;
    transfer_syntax: string;
    stripe_enabled: boolean;
}

const DEFAULT_SETTINGS: PaymentSettings = {
    bank_name: "",
    bank_account_num: "",
    bank_account_name: "",
    transfer_syntax: "VIEAGENT [USER_PHONE]",
    stripe_enabled: false
};

export async function getPaymentSettings(): Promise<PaymentSettings> {
    const supabase = await createClient();

    try {
        const { data, error } = await supabase
            .from("system_config")
            .select("*")
            .in("key", Object.keys(DEFAULT_SETTINGS));

        if (error || !data) {
            // Table might not exist or empty
            return DEFAULT_SETTINGS;
        }

        const settings = { ...DEFAULT_SETTINGS };
        data.forEach((row: { key: string; value: string }) => {
            if (row.key === "stripe_enabled") {
                settings.stripe_enabled = row.value === "true";
            } else {
                // @ts-expect-error - dynamic key assignment
                settings[row.key as keyof PaymentSettings] = row.value;
            }
        });

        return settings;
    } catch {
        return DEFAULT_SETTINGS;
    }
}

export async function savePaymentSettings(settings: PaymentSettings) {
    const supabase = await createClient();

    // Check admin role
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") throw new Error("Forbidden");

    // Upsert each key
    const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value: String(value)
    }));

    const { error } = await supabase.from("system_config").upsert(updates, { onConflict: "key" });

    if (error) {
        throw new Error("Failed to save settings: " + error.message);
    }

    revalidatePath("/dashboard/admin/settings/payment");
    return { success: true };
}
