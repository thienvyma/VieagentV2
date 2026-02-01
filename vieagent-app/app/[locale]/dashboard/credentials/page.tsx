import { createClient } from "@/utils/supabase/server";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/core/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/core/ui/table";
import { AddCredentialForm } from "@/components/business/vault/add-credential-form";
import { DeleteCredentialButton } from "@/components/business/vault/delete-credential-button";

export default async function CredentialsPage() {
    const supabase = await createClient();
    const { data: credentials } = await supabase
        .from("credentials")
        .select("*")
        .order("created_at", { ascending: false });


    interface Credential {
        id: string;
        provider: string;
        key_name: string;
        created_at: string;
    }

    return (
        <div className="grid gap-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Credential Vault</h1>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Add New Key</CardTitle>
                        <CardDescription>
                            Securely store your API keys. They are encrypted before storage.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <AddCredentialForm />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Your Vault</CardTitle>
                        <CardDescription>
                            Manage your stored API keys.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Provider</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead className="w-[50px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {credentials?.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground">No credentials found.</TableCell>
                                    </TableRow>
                                )}
                                {credentials?.map((cred: Credential) => (
                                    <TableRow key={cred.id}>
                                        <TableCell className="font-medium capitalize">{cred.provider}</TableCell>
                                        <TableCell>{cred.key_name}</TableCell>
                                        <TableCell>
                                            <DeleteCredentialButton id={cred.id} />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
