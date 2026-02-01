"use client";

import { usePathname } from "next/navigation";

export function HeaderWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Check if path contains /dashboard (handling locale prefix like /en/dashboard)
    const isDashboard = pathname?.includes('/dashboard');

    if (isDashboard) {
        return null;
    }

    return <>{children}</>;
}
