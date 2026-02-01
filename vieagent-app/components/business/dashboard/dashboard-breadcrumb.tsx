"use client";

import { usePathname, Link } from "@/i18n/routing";
import { ChevronRight, LayoutDashboard } from "lucide-react";
import { Fragment } from "react";

const SEGMENT_labels: Record<string, string> = {
    "dashboard": "Dashboard",
    "admin": "Admin",
    "agents": "Agents",
    "users": "Users",
    "marketplace": "Marketplace",
    "settings": "Settings",
    "run": "Run",
    "credentials": "Vault",
    "billing": "Billing",
    "new": "Create New",
    "history": "History"
};

export function DashboardBreadcrumb() {
    const pathname = usePathname(); // e.g. /dashboard/admin/agents

    // Remove leading slash and split
    const segments = pathname === '/' ? [] : pathname.split('/').filter(Boolean);

    // If empty or just dashboard, show minimal
    if (segments.length === 0) return null;

    return (
        <nav className="flex items-center text-sm font-medium text-muted-foreground">
            <Link href="/dashboard" className="flex items-center hover:text-foreground transition-colors">
                <LayoutDashboard className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline-block">Dashboard</span>
            </Link>

            {segments.map((segment, index) => {
                // Skip 'dashboard' as it is handled by Home icon/link above
                if (segment === 'dashboard') return null;

                // Handling [id] dynamic routes is tricky without context, 
                // but we can detect UUID-like or long strings and show "Detail" or truncate.
                const isUUID = segment.length > 20;
                const label = isUUID ? "Detail" : (SEGMENT_labels[segment] || segment);
                const isLast = index === segments.length - 1;

                // Construct path for link (approximation)
                // In a real app we might need exact reconstruction or valid routes check.
                // For breadcrumbs usually non-clickable or parent-clickable is better.
                // Here we keep it visual (non-clickable for simplicity) or just text.

                return (
                    <Fragment key={index}>
                        <ChevronRight className="w-4 h-4 mx-1 text-muted-foreground/50" />
                        <span className={isLast ? "text-foreground font-semibold" : "hover:text-foreground transition-colors"}>
                            {label}
                        </span>
                    </Fragment>
                );
            })}
        </nav>
    );
}
