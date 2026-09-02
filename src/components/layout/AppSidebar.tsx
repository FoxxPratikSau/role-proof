"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useFormStatus } from "react-dom";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  LayoutTemplate,
  Loader2,
  LogOut,
  Settings,
  Sparkles,
  WandSparkles,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  const [isCollapsed, setIsCollapsed] = useState(false);
  return (
    <aside
      data-collapsed={isCollapsed}
      className="peer fixed inset-x-0 bottom-0 z-40 border-t border-sidebar-border bg-sidebar text-sidebar-foreground md:inset-y-0 md:right-auto md:w-60 md:border-t-0 md:border-r md:transition-[width] md:duration-150 md:data-[collapsed=true]:w-20"
    >
      <div className="hidden h-full flex-col md:flex">
        <div
          className={cn(
            "flex h-20 items-center border-b border-sidebar-border",
            isCollapsed ? "justify-center gap-1 px-2" : "gap-2 px-5",
          )}
        >
          <Link
            href="/"
            aria-label={isCollapsed ? "RoleProof home" : undefined}
            className={cn(
              "flex min-w-0 items-center gap-3 rounded-lg focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none",
              !isCollapsed && "flex-1",
            )}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white text-sidebar">
              <Sparkles className="size-4" aria-hidden="true" />
            </span>
            {!isCollapsed && (
              <span className="min-w-0">
                <span className="block truncate text-base font-semibold tracking-tight">
                  RoleProof
                </span>
                <span className="block truncate text-[11px] text-sidebar-foreground/55">
                  Candidate workspace
                </span>
              </span>
            )}
          </Link>
          <Tooltip>
            <TooltipTrigger
              render={
                <button
                  type="button"
                  aria-label={
                    isCollapsed ? "Expand sidebar" : "Collapse sidebar"
                  }
                  aria-expanded={!isCollapsed}
                  onClick={() => setIsCollapsed((current) => !current)}
                  className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-transparent text-sidebar-foreground/60 transition-colors hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none"
                />
              }
            >
              {isCollapsed ? (
                <ChevronRight className="size-4" aria-hidden="true" />
              ) : (
                <ChevronLeft className="size-4" aria-hidden="true" />
              )}
            </TooltipTrigger>
            <TooltipContent side="right">
              {isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            </TooltipContent>
          </Tooltip>
        </div>
        <nav
          aria-label="Workspace"
          className={cn(
            "flex flex-1 flex-col gap-1.5 py-5",
            isCollapsed ? "px-2" : "px-3",
          )}
        >
          {!isCollapsed && (
            <p className="px-3 pb-2 text-[10px] font-semibold tracking-[0.18em] text-sidebar-foreground/45 uppercase">
              Workspace
            </p>
          )}
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const link = (
              <Link
                key={item.href}
                href={item.href}
                aria-label={isCollapsed ? item.label : undefined}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none",
                  isCollapsed && "justify-center px-0",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <item.icon className="size-[18px]" aria-hidden="true" />
                {!isCollapsed && item.label}
                {isActive && !isCollapsed && (
                  <span className="ml-auto size-1.5 rounded-full bg-[#5bd2c4]" />
                )}
              </Link>
            );
            return isCollapsed ? (
              <Tooltip key={item.href}>
                <TooltipTrigger render={link} />
                <TooltipContent side="right">{item.label}</TooltipContent>
              </Tooltip>
            ) : (
              link
            );
          })}
        </nav>
        <div
          className={cn(
            "border-t border-sidebar-border",
            isCollapsed ? "p-2" : "p-4",
          )}
        >
          <div
            className={cn(
              "flex items-center gap-3 px-1",
              isCollapsed && "justify-center",
            )}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent text-xs font-semibold text-sidebar-foreground uppercase">
              {initials(user.name)}
            </span>
            {!isCollapsed && (
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">
                  {user.name}
                </span>
                <span className="block truncate text-[11px] text-sidebar-foreground/50">
                  {user.email}
                </span>
              </span>
            )}
          </div>
          <form action={logoutAction} className="mt-3" noValidate>
            {isCollapsed ? (
              <Tooltip>
                <TooltipTrigger render={<SignOutButton iconOnly />} />
                <TooltipContent side="right">Sign out</TooltipContent>
              </Tooltip>
            ) : (
              <SignOutButton />
            )}
          </form>
          {!isCollapsed && (
            <p className="mt-3 px-1 text-[11px] leading-4 text-sidebar-foreground/45">
              Resume data syncs to your account. API keys stay in this browser.
            </p>
          )}
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

const SignOutButton = ({
  compact = false,
  iconOnly = false,
}: {
  compact?: boolean;
  iconOnly?: boolean;
}) => {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      aria-label={iconOnly ? (pending ? "Signing out" : "Sign out") : undefined}
      className={cn(
        "flex w-full items-center rounded-lg text-sidebar-foreground/65 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50",
        iconOnly
          ? "h-9 justify-center px-0"
          : compact
            ? "flex-col justify-center gap-1 text-[11px] font-medium"
            : "h-9 gap-2 px-2 text-xs font-medium",
      )}
    >
      {pending ? (
        <Loader2 className="size-[18px] animate-spin" aria-hidden="true" />
      ) : (
        <LogOut className="size-[18px]" aria-hidden="true" />
      )}
      {!iconOnly && (pending ? "Signing out" : "Sign out")}
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
