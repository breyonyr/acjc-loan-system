"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth-actions";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    role?: string;
  };
}

const navItems = [
  {
    href: "/dashboard",
    label: "Home",
    icon: "M3 3h7v7H3V3zm11 0h7v7h-7V3zm0 11h7v7h-7v-7zM3 14h7v7H3v-7z",
  },
  {
    href: "/borrow",
    label: "Borrow",
    icon: "M12 5v14M5 12h14",
  },
  {
    href: "/history",
    label: "History",
    icon: "M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  },
  {
    href: "/equipment",
    label: "Browse",
    icon: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
  },
];

const desktopNavItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: "M3 3h7v7H3V3zm11 0h7v7h-7V3zm0 11h7v7h-7v-7zM3 14h7v7H3v-7z",
  },
  {
    href: "/borrow",
    label: "Borrow",
    icon: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v8M8 12h8",
  },
  {
    href: "/history",
    label: "History",
    icon: "M12 8v4l3 3m6-3a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  },
  {
    href: "/equipment",
    label: "Equipment",
    icon: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
  },
];

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const isAdmin = user.role === "admin";

  const desktopLinks = isAdmin
    ? [
        ...desktopNavItems,
        {
          href: "/admin/users",
          label: "Users",
          icon: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
        },
        {
          href: "/admin",
          label: "Admin",
          icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
        },
      ]
    : desktopNavItems;

  // Mobile: admin gets an "Admin" tab instead of separate Users + Admin (keeps it to 5 tabs max)
  const mobileLinks = isAdmin
    ? [
        ...navItems,
        {
          href: "/admin",
          label: "Admin",
          icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
        },
      ]
    : navItems;

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  function isActive(href: string) {
    return pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
  }

  function cycleTheme() {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  }

  return (
    <>
      {/* ── Top bar ── */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-sm font-semibold text-foreground"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                  <polyline points="3.29 7 12 12 20.71 7" />
                  <line x1="12" x2="12" y1="22" y2="12" />
                </svg>
              </div>
              <span className="hidden sm:inline">ACJC Equipment</span>
            </Link>

            {/* Desktop nav — hidden on mobile */}
            <nav className="hidden sm:flex items-center gap-0.5">
              {desktopLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "relative rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      active
                        ? "text-primary bg-primary/8"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {link.label}
                    {active && (
                      <span className="absolute inset-x-1 -bottom-[calc(0.5rem+1px)] h-0.5 rounded-full bg-primary" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme toggle */}
            <button
              type="button"
              onClick={cycleTheme}
              className="rounded-md p-2 text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Toggle theme"
              suppressHydrationWarning
            >
              {/* Sun icon (shown in dark mode) */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="hidden dark:block"
              >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2" />
                <path d="M12 20v2" />
                <path d="m4.93 4.93 1.41 1.41" />
                <path d="m17.66 17.66 1.41 1.41" />
                <path d="M2 12h2" />
                <path d="M20 12h2" />
                <path d="m6.34 17.66-1.41 1.41" />
                <path d="m19.07 4.93-1.41 1.41" />
              </svg>
              {/* Moon icon (shown in light mode) */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="block dark:hidden"
              >
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger suppressHydrationWarning className="flex items-center gap-2 rounded-full outline-none ring-ring focus-visible:ring-2">
                <Avatar className="h-8 w-8 border border-border">
                  <AvatarImage src={user.image || undefined} alt={user.name || "User"} />
                  <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="cursor-pointer p-0">
                  <Link href="/profile" className="flex w-full px-2 py-1.5">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <>
                    <DropdownMenuItem className="cursor-pointer p-0">
                      <Link href="/admin" className="flex w-full px-2 py-1.5">Admin Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="cursor-pointer p-0">
                      <Link href="/admin/users" className="flex w-full px-2 py-1.5">Manage Users</Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                  </>
                )}
                <DropdownMenuItem
                  onClick={() => signOut()}
                  className="cursor-pointer text-muted-foreground"
                >
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* ── Mobile bottom tab bar ── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border/50 sm:hidden">
        <div className="flex items-center justify-around px-1">
          {mobileLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative flex flex-col items-center justify-center py-2 px-3 transition-colors",
                  active && "bg-primary/8 rounded-lg"
                )}
              >
                {/* Active indicator dot */}
                {active && (
                  <span className="absolute top-1 h-1 w-5 rounded-full bg-primary" />
                )}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={active ? "2.5" : "1.5"}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={cn(
                    "transition-colors",
                    active ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <path d={link.icon} />
                </svg>
                <span className={cn(
                  "mt-0.5 text-[10px] font-medium",
                  active ? "text-primary font-semibold" : "text-muted-foreground"
                )}>
                  {link.label}
                </span>
              </Link>
            );
          })}
        </div>
        {/* Safe area for phones with home indicator */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </>
  );
}
