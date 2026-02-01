import { redirect } from "next/navigation"

import { CircleUser, Sparkles, Menu, LogOut } from "lucide-react"

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
import { Sheet, SheetContent, SheetTrigger } from "@/components/core/ui/sheet"
import { ModeToggle } from "@/components/mode-toggle"
import { getTranslations } from "next-intl/server"
import { SidebarNav } from "@/components/business/dashboard/sidebar-nav"
import { DashboardBreadcrumb } from "@/components/business/dashboard/dashboard-breadcrumb"

async function SignOut() {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
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
    const commonT = await getTranslations('Common')

    if (!user) {
        redirect(`/${locale}/login`)
    }

    const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single<{ role: string }>()

    const navTranslations = {
        myAgents: t('myAgents'),
        vault: commonT('vault'),
        settings: commonT('settings'),
        history: t('executionHistory')
    }

    return (
        <div className="flex min-h-screen w-full relative">
            {/* FLOATING SIDEBAR (Glass) */}
            <aside className="hidden md:flex flex-col w-[260px] fixed top-4 bottom-4 left-4 z-40 glass-panel rounded-3xl overflow-hidden shadow-2xl">
                {/* Logo Area */}
                <div className="h-20 flex items-center px-6 border-b border-border bg-muted/20 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                            VieAgent
                        </span>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex-1 py-6 px-3 custom-scrollbar overflow-y-auto">
                    <SidebarNav t={navTranslations} role={userProfile?.role || 'customer'} />
                </div>

                {/* Footer User Info (Mini) */}
                <div className="p-4 border-t border-border bg-muted/20 backdrop-blur-md">
                    <div className="flex items-center gap-3 w-full">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 dark:from-gray-700 dark:to-gray-900 border border-border" />
                        <div className="flex flex-col flex-1 overflow-hidden">
                            <span className="text-xs font-semibold truncate">{user.email?.split('@')[0]}</span>
                            <span className="text-[10px] text-muted-foreground">Gói Miễn Phí</span>
                        </div>
                        <form action={SignOut}>
                            <button type="submit" className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors group" title="Log out">
                                <LogOut className="w-4 h-4" />
                            </button>
                        </form>
                    </div>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col md:pl-[290px] min-h-screen transition-all">
                {/* Header (Floating Glass) */}
                <header className="h-[70px] flex items-center justify-between px-6 sticky top-4 z-30 mx-4 md:mr-4 rounded-2xl glass">
                    <div className="flex items-center gap-3">
                        {/* Mobile SideBar Trigger */}
                        <div className="md:hidden">
                            <Sheet>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="hover:bg-muted">
                                        <Menu className="h-5 w-5" />
                                        <span className="sr-only">Toggle menu</span>
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="left" className="p-0 border-none bg-transparent w-[280px]">
                                    <div className="h-full w-full glass-panel rounded-r-3xl overflow-hidden flex flex-col border-r border-black/5 dark:border-white/20">
                                        {/* Logo Area */}
                                        <div className="h-20 flex items-center px-6 border-b border-border bg-muted/20 backdrop-blur-sm">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
                                                    <Sparkles className="w-4 h-4 text-white" />
                                                </div>
                                                <span className="font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
                                                    VieAgent
                                                </span>
                                            </div>
                                        </div>

                                        {/* Navigation */}
                                        <div className="flex-1 py-6 px-3 custom-scrollbar overflow-y-auto">
                                            <SidebarNav t={navTranslations} role={userProfile?.role || 'customer'} />
                                        </div>

                                        {/* Footer User Info (Mini) */}
                                        <div className="p-4 border-t border-border bg-muted/20 backdrop-blur-md">
                                            <div className="flex items-center gap-3 w-full">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-200 to-gray-400 dark:from-gray-700 dark:to-gray-900 border border-black/5 dark:border-white/30" />
                                                <div className="flex flex-col flex-1 overflow-hidden">
                                                    <span className="text-xs font-semibold truncate">{user.email?.split('@')[0]}</span>
                                                    <span className="text-[10px] text-muted-foreground">Gói Miễn Phí</span>
                                                </div>
                                                <form action={SignOut}>
                                                    <button type="submit" className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-destructive/10 hover:text-destructive transition-colors group" title="Log out">
                                                        <LogOut className="w-4 h-4" />
                                                    </button>
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>

                        < DashboardBreadcrumb />
                    </div>

                    <div className="flex items-center gap-3">
                        <ModeToggle />
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted transition-colors">
                                    <CircleUser className="h-5 w-5" />
                                    <span className="sr-only">Toggle user menu</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 glass-panel">
                                <DropdownMenuLabel>{commonT('myAccount')}</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-border" />
                                <DropdownMenuItem className="focus:bg-primary/10">{commonT('settings')}</DropdownMenuItem>
                                <DropdownMenuItem className="focus:bg-primary/10">{commonT('support')}</DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-border" />
                                <form action={SignOut}>
                                    <button type="submit" className="w-full text-left">
                                        <DropdownMenuItem className="text-destructive focus:bg-destructive/10">
                                            {commonT('logout')}
                                        </DropdownMenuItem>
                                    </button>
                                </form>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-8 md:pr-4 pt-12 md:pt-14">
                    {children}
                </main>
            </div>
        </div>
    )
}

