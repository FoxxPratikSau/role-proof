"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useFormStatus } from "react-dom";
import {
  FileText,
  LayoutTemplate,
  Loader2,
  LogOut,
  Settings,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import { logoutAction } from "@/lib/auth/actions";
import type { AuthUser } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/app/builder",
    label: "Tailor resume",
    shortLabel: "Builder",
    icon: WandSparkles,
  },
  {
    href: "/app/resume",
    label: "Master resume",
    shortLabel: "Resume",
    icon: FileText,
  },
  {
    href: "/app/templates",
    label: "Resume templates",
    shortLabel: "Templates",
    icon: LayoutTemplate,
  },
  {
    href: "/app/settings",
    label: "AI settings",
    shortLabel: "Settings",
    icon: Settings,
  },
];

export const AppSidebar = ({ user }: { user: AuthUser }) => {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-x-0 bottom-0 z-40 border-t border-sidebar-border bg-sidebar text-sidebar-foreground md:inset-y-0 md:right-auto md:w-60 md:border-t-0 md:border-r">
      <div className="hidden h-full flex-col md:flex">
        <Link
          href="/"
          className="flex h-20 items-center gap-3 border-b border-sidebar-border px-5 focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none"
        >
          <span className="flex size-9 items-center justify-center rounded-lg bg-white text-sidebar">
            <Sparkles className="size-4" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-base font-semibold tracking-tight">
              RoleProof
            </span>
            <span className="block text-[11px] text-sidebar-foreground/55">
              Candidate workspace
            </span>
          </span>
        </Link>
        <nav
          aria-label="Workspace"
          className="flex flex-1 flex-col gap-1.5 px-3 py-5"
        >
          <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.18em] text-sidebar-foreground/45 uppercase">
            Workspace
          </p>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <item.icon className="size-[18px]" aria-hidden="true" />
                {item.label}
                {isActive && (
                  <span className="ml-auto size-1.5 rounded-full bg-[#5bd2c4]" />
                )}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-sidebar-border p-4">
          <div className="flex items-center gap-3 px-1">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent text-xs font-semibold text-sidebar-foreground uppercase">
              {initials(user.name)}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold">
                {user.name}
              </span>
              <span className="block truncate text-[11px] text-sidebar-foreground/50">
                {user.email}
              </span>
            </span>
          </div>
          <form action={logoutAction} className="mt-3" noValidate>
            <SignOutButton />
          </form>
          <p className="mt-3 px-1 text-[11px] leading-4 text-sidebar-foreground/45">
            Resume data syncs to your account. API keys stay in this browser.
          </p>
        </div>
      </div>

      <nav
        aria-label="Workspace"
        className="grid h-[calc(4.5rem+env(safe-area-inset-bottom))] grid-cols-5 gap-1 px-2 pt-2 pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-medium transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/60 hover:text-sidebar-foreground",
              )}
            >
              <item.icon className="size-[18px]" aria-hidden="true" />
              {item.shortLabel}
            </Link>
          );
        })}
        <form action={logoutAction} className="contents" noValidate>
          <SignOutButton compact />
        </form>
      </nav>
    </aside>
  );
};

const SignOutButton = ({ compact = false }: { compact?: boolean }) => {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={cn(
        "flex w-full items-center rounded-lg text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        compact
          ? "flex-col justify-center gap-1 text-[11px] font-medium"
          : "h-9 gap-2 px-2 text-xs font-medium",
      )}
    >
      {pending ? (
        <Loader2 className="size-[18px] animate-spin" aria-hidden="true" />
      ) : (
        <LogOut className="size-[18px]" aria-hidden="true" />
      )}
      {pending ? "Signing out" : "Sign out"}
    </button>
  );
};

const initials = (name: string): string => {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("") || "RP"
  );
};
