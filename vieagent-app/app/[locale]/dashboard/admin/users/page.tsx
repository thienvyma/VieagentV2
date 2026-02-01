import { createClient } from "@/utils/supabase/server";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/core/ui/table";
import { Badge } from "@/components/core/ui/badge";
import { format } from "date-fns";

// Basic User List
export default async function AdminUsersPage() {
    const supabase = await createClient();
    const { data: users } = await supabase.from('users').select('*').order('created_at', { ascending: false });

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Users</h1>
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead>Joined</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!users || users.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center py-8">No users found.</TableCell>
                            </TableRow>
                        ) : (
                            users.map((user: any) => (
                                <TableRow key={user.id}>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>{user.full_name || 'N/A'}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === 'admin' ? 'destructive' : 'secondary'}>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{format(new Date(user.created_at), "PPP")}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
