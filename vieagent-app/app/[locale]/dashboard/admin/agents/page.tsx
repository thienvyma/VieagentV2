import { createClient } from "@/utils/supabase/server";
import { Button } from "@/components/core/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/core/ui/table";
import { Badge } from "@/components/core/ui/badge";
import { Link } from "@/i18n/routing";
import { Plus, Edit } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { Agent } from "@/types/agent";

export default async function AdminAgentsPage() {
    const supabase = await createClient();
    const { data: agents } = await supabase.from('agents').select('*').order('created_at', { ascending: false });
    const commonT = await getTranslations("Common");

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Agents</h1>
                <Link href="/dashboard/admin/agents/new">
                    <Button className="gap-2"><Plus className="h-4 w-4" /> New Agent</Button>
                </Link>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Price</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {!agents || agents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8">{commonT('loading')}</TableCell>
                            </TableRow>
                        ) : (
                            agents.map((agent: Agent) => (
                                <TableRow key={agent.id}>
                                    <TableCell className="font-medium">{agent.name}</TableCell>
                                    <TableCell>${(agent.price / 100).toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Badge variant={agent.status === 'published' ? 'default' : 'secondary'}>
                                            {agent.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{agent.category}</TableCell>
                                    <TableCell className="text-right">
                                        <Link href={`/dashboard/admin/agents/${agent.id}`}>
                                            <Button variant="ghost" size="icon">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
