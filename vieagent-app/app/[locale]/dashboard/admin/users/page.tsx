import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { redirect } from "next/navigation";
import { UserManagementClient, UserProfile } from "@/components/business/admin/users/user-management-client";

export default async function AdminUsersPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // 1. Basic Auth Check
    if (!user) {
        redirect("/login");
    }

    // 2. Role Check (using standard client is fine, but admin client is safer if RLS is strict)
    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || profile.role !== 'admin') {
        redirect("/dashboard");
    }

    // 3. Fetch ALL users (Auth + Profile) using Service Role
    const supabaseAdmin = createAdminClient();

    // A. Fetch Auth Users (Pagination? For now list 50 or 100)
    const { data: { users: authUsers }, error: authListError } = await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000
    });

    if (authListError || !authUsers) {
        console.error("Failed to list auth users:", authListError);
        // Fallback: Just return empty or handle error
        return <div className="p-8 text-destructive">Error fetching users from Auth system.</div>;
    }

    // B. Fetch Profiles (ALL)
    const { data: profiles, error: dbError } = await supabaseAdmin
        .from('users')
        .select('*');

    if (dbError) {
        console.error("Failed to fetch profiles:", dbError);
    }

    // C. Merge Data
    const combinedUsers: UserProfile[] = authUsers.map(au => {
        const p = profiles?.find((prof) => prof.id === au.id);
        return {
            id: au.id,
            email: au.email || null,
            full_name: p?.full_name || null,
            role: p?.role || 'customer', // Default to customer if no profile row
            created_at: au.created_at
        };
    });

    // Sort by created_at desc
    combinedUsers.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Users Management</h1>
            <p className="text-muted-foreground">Manage all registered users and their roles.</p>

            <UserManagementClient initialUsers={combinedUsers} />
        </div>
    );
}
