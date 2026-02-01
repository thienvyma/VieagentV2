import { redirect } from "next/navigation"
import { Link } from "@/i18n/routing"
import { CircleUser, Key, LayoutDashboard, Settings } from "lucide-react"

import { createClient } from "@/utils/supabase/server"
import { Button } from "@/components/core/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/core/ui/dropdown-menu"
import { ModeToggle } from "@/components/mode-toggle"
import { getTranslations } from "next-intl/server"

async function SignOut() {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    // For sign out, a hard redirect to root is often safest or to login.
    // Since we don't have easy access to locale here, we can redirect to / which will be caught by middleware.
    redirect("/login")
}

export default async function DashboardLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}) {
    const { locale } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const t = await getTranslations('Dashboard')
    const navT = await getTranslations('Navigation')
    const commonT = await getTranslations('Common')

    if (!user) {
        redirect(`/${locale}/login`)
    }

    return (
        <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
            <div className="hidden border-r bg-muted/40 md:block">
                <div className="flex h-full max-h-screen flex-col gap-2">
                    <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                        <Link href="/" className="flex items-center gap-2 font-semibold">
                            <span className="">VieAgent V2</span>
                        </Link>
                    </div>
                    <div className="flex-1">
                        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                            <Link
                                href="/dashboard"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                {t('myAgents')}
                            </Link>
                            <Link
                                href="/dashboard/credentials"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            >
                                <Key className="h-4 w-4" />
                                {commonT('vault')}
                            </Link>
                            <Link
                                href="/dashboard/settings"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
                            >
                                <Settings className="h-4 w-4" />
                                {commonT('settings')}
                            </Link>
                        </nav>
                    </div>
                </div>
            </div>
            <div className="flex flex-col">
                <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
                    <div className="w-full flex-1">
                    </div>
                    <ModeToggle />
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="secondary" size="icon" className="rounded-full">
                                <CircleUser className="h-5 w-5" />
                                <span className="sr-only">Toggle user menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{commonT('myAccount')}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>{commonT('settings')}</DropdownMenuItem>
                            <DropdownMenuItem>{commonT('support')}</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <form action={SignOut}>
                                <button type="submit" className="w-full text-left">
                                    <DropdownMenuItem className="text-destructive">
                                        {commonT('logout')}
                                    </DropdownMenuItem>
                                </button>
                            </form>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </header>
                <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
                    {children}
                </main>
            </div>
        </div>
    )
}
