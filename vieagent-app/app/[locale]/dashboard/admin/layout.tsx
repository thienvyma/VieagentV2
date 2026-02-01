import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";


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
        <div className="flex flex-col space-y-6 h-full">
            <div className="flex-1">
                {children}
            </div>
        </div>
    );
}
