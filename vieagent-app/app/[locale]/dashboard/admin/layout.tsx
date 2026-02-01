import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Shield, Users, Box, BarChart3, Settings } from "lucide-react";
import { Button } from "@/components/core/ui/button";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Security Check: Role === 'admin'
    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || profile.role !== 'admin') {
        // Not an admin, kick them out to customer dashboard
        redirect("/dashboard");
    }

    return (
        <div className="flex flex-col space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
                <div className="flex items-center gap-2">
                    <Shield className="h-6 w-6 text-red-600" />
                    <h2 className="text-lg font-semibold tracking-tight">Admin Portal</h2>
                </div>
                <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
                    <Link href="/dashboard/admin" className="hover:text-primary transition-colors">Overview</Link>
                    <Link href="/dashboard/admin/agents" className="hover:text-primary transition-colors">Agents</Link>
                    <Link href="/dashboard/admin/users" className="hover:text-primary transition-colors">Users</Link>
                    <Link href="/dashboard/admin/billing" className="hover:text-primary transition-colors">Finances</Link>
                </div>
            </div>

            <div className="flex-1">
                {children}
            </div>
        </div>
    );
}
