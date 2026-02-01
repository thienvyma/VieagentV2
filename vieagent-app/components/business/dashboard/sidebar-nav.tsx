"use client"

import { Link } from "@/i18n/routing"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import { LayoutDashboard, Key, Settings, Sparkles, Shield, Users, Bot, History, CreditCard, LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

interface SidebarNavProps {
  t: {
    myAgents: string
    vault: string
    settings: string
    history?: string
  }
  role?: string
}

interface NavLink {
  href: string
  label: string
  icon: LucideIcon
  matchExact?: boolean
}

export function SidebarNav({ t, role = 'customer' }: SidebarNavProps) {
  const pathname = usePathname()

  const links: NavLink[] = [
    // Customer Links
    {
      href: "/dashboard",
      label: t.myAgents,
      icon: LayoutDashboard,
      matchExact: true
    },
    {
      href: "/dashboard/history",
      label: t.history || "History",
      icon: History,
    },
    {
      href: "/dashboard/credentials",
      label: t.vault,
      icon: Key,
    },
    {
      href: "/dashboard/settings",
      label: t.settings,
      icon: Settings,
    },
  ]

  // Admin Links
  if (role === 'admin') {
    links.push(
      {
        href: "/dashboard/admin",
        label: "Admin Overview",
        icon: Shield,
        matchExact: true,
      },
      {
        href: "/dashboard/admin/agents",
        label: "Manage Agents",
        icon: Bot,
      },
      {
        href: "/dashboard/admin/users",
        label: "Manage Users",
        icon: Users,
      },
      {
        href: "/dashboard/admin/payment",
        label: "Payment Settings",
        icon: CreditCard,
      }
    )
  }

  return (
    <nav className="flex flex-col gap-2 p-2">
      {links.map((link) => {
        // Simple separator for Admin links check
        const isAdminLink = link.href.includes('/admin')

        const isActive = link.matchExact
          ? pathname === link.href || pathname.endsWith(link.href)
          : pathname?.includes(link.href)

        return (
          <div key={link.href}>
            {isAdminLink && link.href === '/dashboard/admin' && (
              <div className="px-4 py-2 mt-4 mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                Khu vực Quản trị
              </div>
            )}
            <Link
              href={link.href}
              className={cn(
                "relative flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 active:scale-95",
                "hover:text-primary group overflow-hidden",
                isActive ? "text-primary shadow-sm ring-1 ring-border" : "text-muted-foreground"
              )}
            >
              {/* Active Background - Glass Effect */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className="absolute inset-0 z-0 rounded-xl bg-secondary/80 dark:bg-white/10 backdrop-blur-md"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}

              {/* Hover Glow */}
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-primary/5 to-transparent z-0" />

              {/* Icon & Text */}
              <span className="relative z-10 flex items-center gap-3">
                <link.icon className={cn("h-5 w-5 transition-colors", isActive && "text-primary")} />
                {link.label}
              </span>

              {/* Active Indicator Dot */}
              {isActive && (
                <motion.div
                  layoutId="sidebar-dot"
                  className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.6)]"
                />
              )}
            </Link>
          </div>
        )
      })}

      {/* Premium Upgrade Banner (Static for now) */}
      {role !== 'admin' && (
        <div className="mt-8 relative overflow-hidden rounded-2xl glass-panel p-4 border border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 rounded-lg bg-primary/10">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="text-xs font-bold text-foreground">Gói Pro</span>
          </div>
          <p className="text-[10px] text-muted-foreground mb-3">Mở khóa mọi mô hình AI.</p>
          <button className="w-full text-xs py-1.5 rounded-lg bg-primary text-primary-foreground font-medium shadow-lg hover:shadow-primary/20 transition-all active:scale-95">
            Nâng cấp ngay
          </button>
        </div>
      )}


    </nav>
  )
}
