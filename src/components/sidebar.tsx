"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Swords,
  CalendarDays,
  Wrench,
  BarChart3,
  User,
  Menu,
  X,
  ChevronLeft,
  LogOut,
  Feather,
  MessageSquarePlus,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useCurrency } from "@/contexts/currency-context";
import { CURRENCIES } from "@/lib/currency";

const baseNavItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/rackets", label: "Rackets", icon: Swords },
  { href: "/sessions", label: "Sessions", icon: CalendarDays },
  { href: "/stringing", label: "Stringing", icon: Wrench },
  { href: "/shuttles", label: "Shuttles", icon: Feather },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/feedback", label: "Feedback", icon: MessageSquarePlus },
];

export function Sidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: session } = useSession();
  const { currency, setCurrency } = useCurrency();

  const navItems = isAdmin
    ? [...baseNavItems, { href: "/admin", label: "Admin", icon: ShieldCheck }]
    : baseNavItems;

  return (
    <>
      {/* Mobile menu button */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden rounded-md bg-background border p-2 shadow-sm"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-full bg-background border-r transition-all duration-300 flex flex-col",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className={cn("flex items-center border-b h-16 px-4", collapsed && "justify-center")}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏸</span>
            {!collapsed && (
              <span className="font-bold text-lg tracking-tight">ShuttleTrack</span>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  collapsed && "justify-center px-2"
                )}
              >
                <item.icon size={20} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Currency switcher */}
        {!collapsed && (
          <div className="px-3 py-2 border-t">
            <p className="text-xs text-muted-foreground mb-1.5">Currency</p>
            <div className="flex gap-1">
              {CURRENCIES.map((c) => (
                <button
                  key={c.code}
                  onClick={() => setCurrency(c.code)}
                  className={cn(
                    "flex-1 text-xs py-1 rounded border transition-colors",
                    currency === c.code
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-input hover:bg-accent"
                  )}
                >
                  {c.symbol} {c.code}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Collapse toggle */}
        <button
          className="hidden md:flex items-center justify-center h-12 border-t text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft
            size={18}
            className={cn("transition-transform", collapsed && "rotate-180")}
          />
        </button>

        {/* User info + sign out */}
        {session?.user && (
          <div className={cn("border-t p-3", collapsed && "px-1")}>
            {!collapsed ? (
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {session.user.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={session.user.image}
                      alt={session.user.name ?? ""}
                      className="w-7 h-7 rounded-full shrink-0"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <User size={14} />
                    </div>
                  )}
                  <span className="text-xs font-medium truncate">
                    {session.user.name ?? session.user.email}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                  className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
                  title="Sign out"
                >
                  <LogOut size={15} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                className="flex justify-center w-full text-muted-foreground hover:text-foreground transition-colors"
                title="Sign out"
              >
                <LogOut size={15} />
              </button>
            )}
          </div>
        )}
      </aside>

      {/* Spacer */}
      <div
        className={cn(
          "hidden md:block transition-all duration-300 shrink-0",
          collapsed ? "w-16" : "w-64"
        )}
      />
    </>
  );
}
