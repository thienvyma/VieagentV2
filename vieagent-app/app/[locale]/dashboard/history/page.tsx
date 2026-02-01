import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ExecutionHistoryTable } from "@/components/business/execution/execution-history-table";

// Define the execution record type for Supabase query
interface ExecutionFromDB {
    id: string;
    agent_id: string;
    status: "pending" | "running" | "success" | "failed";
    result: unknown;
    started_at: string;
    completed_at: string | null;
    agents: {
        name: string;
        cover_image?: string;
    } | null;
}

export default async function HistoryPage() {
    const supabase = await createClient();
    const t = await getTranslations("Dashboard");

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        redirect("/login");
    }

    // Fetch user's execution history
    const { data: executions, error } = await supabase
        .from("workflow_executions")
        .select(`
            id,
            agent_id,
            status,
            result,
            started_at,
            completed_at,
            agents (
                name,
                cover_image
            )
        `)
        .eq("user_id", user.id)
        .order("started_at", { ascending: false })
        .limit(50);

    if (error) {
        // Only log if meaningful error

        console.error("History Fetch Error:", error.message || JSON.stringify(error, null, 2));
    }

    // Cast to proper type
    const typedExecutions = (executions || []) as unknown as ExecutionFromDB[];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">{t("executionHistory")}</h1>
                <p className="text-muted-foreground">
                    {t("executionHistorySubtitle")}
                </p>
            </div>

            <ExecutionHistoryTable executions={typedExecutions} />
        </div>
    );
}

