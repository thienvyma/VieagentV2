"use client";

import { useState } from "react";
import { deleteCredential } from "@/app/[locale]/dashboard/credentials/actions"; // We might want actions to be in business logic too, but for now app actions are fine or move to lib?
// Keeping actions in app for now as they are bound to the page, but importing from business component is okay.
import { Button } from "@/components/core/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function DeleteCredentialButton({ id }: { id: string }) {
    const [isDeleting, setIsDeleting] = useState(false);

    async function handleDelete() {
        if (!confirm("Are you sure?")) return;
        setIsDeleting(true);
        const res = await deleteCredential(id);
        if (res?.error) {
            toast.error(res.error);
            setIsDeleting(false);
        } else {
            toast.success("Deleted");
            // path revalidates automatically
        }
    }

    return (
        <Button variant="ghost" size="icon" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-destructive" />}
        </Button>
    )
}
