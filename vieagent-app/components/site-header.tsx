import { Link } from "@/i18n/routing"
import { createClient } from "@/utils/supabase/server"
import { Button } from "@/components/core/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { LanguageToggle } from "@/components/language-toggle"
import { CircleUser, LayoutDashboard } from "lucide-react"
import { getTranslations } from 'next-intl/server'

export async function SiteHeader() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const t = await getTranslations('Navigation')

    // Helper to get localized href. 
    // In SC with Server Actions/Supabase we might not know current locale easily 
    // without prop drilling?
    // Actually, getting 'locale' in Server Component usually comes from params.
    // We don't have params here.
    // But 'getTranslations' works automagically via AsyncLocalStorage.
    // 'Link' from next/link creates non-localized links "/..."
    // We need to support prefix?
    // Ideally we should use the Link from '@/i18n/routing' but that might cause 'use client' issues if not careful.
    // For now, I will assume the middleware handles redirects if we point to /marketplace (it will redirect to /en/marketplace or /vi/marketplace).
    // Or I can force it? 
    // Let's stick to standard Link for now to avoid complexity in this file, relying on middleware.

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
                <div className="mr-4 hidden md:flex">
                    <Link href="/" className="mr-6 flex items-center space-x-2">
                        <span className="hidden font-bold sm:inline-block">
                            VieAgent V2
                        </span>
                    </Link>
                    <nav className="flex items-center gap-6 text-sm font-medium">
                        <Link
                            href="/marketplace"
                            className="transition-colors hover:text-foreground/80 text-foreground"
                        >
                            {t('marketplace')}
                        </Link>
                        {/* Add more public links here */}
                    </nav>
                </div>
                <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
                    <div className="w-full flex-1 md:w-auto md:flex-none">
                        {/* Search could go here */}
                    </div>
                    <nav className="flex items-center gap-2">
                        <LanguageToggle />
                        <ModeToggle />
                        {user ? (
                            <Link href="/dashboard">
                                <Button variant="ghost" size="sm" className="gap-2">
                                    <LayoutDashboard className="h-4 w-4" />
                                    {t('dashboard')}
                                </Button>
                            </Link>
                        ) : (
                            <div className="flex gap-2">
                                <Link href="/login">
                                    <Button variant="ghost" size="sm">{t('login')}</Button>
                                </Link>
                                <Link href="/signup">
                                    <Button size="sm">{t('getStarted')}</Button>
                                </Link>
                            </div>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    )
}
