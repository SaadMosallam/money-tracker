"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import {
  ArrowRightLeft,
  LayoutDashboard,
  PlusCircle,
  Receipt,
  BanknoteArrowUp,
  User,
  Sun,
  Moon,
  LogIn,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserInitials } from "@/lib/utils/userInitials";
import { useEffect, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type NavItem = {
  href: string;
  label: string;
  mobileLabel?: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/expenses", label: "Expenses", icon: <Receipt className="h-4 w-4" /> },
  { href: "/payments", label: "Payments", icon: <ArrowRightLeft className="h-4 w-4" /> },
  {
    href: "/expenses/new",
    label: "New Expense",
    mobileLabel: "Expense",
    icon: <PlusCircle className="h-4 w-4" />,
  },
  {
    href: "/payments/new",
    label: "New Payment",
    mobileLabel: "Payment",
    icon: <BanknoteArrowUp className="h-4 w-4" />,
  },
];

const isActive = (pathname: string, href: string) => {
  return pathname === href;
};

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const isLoginPage = pathname === "/login";
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const displayName = session?.user?.name ?? session?.user?.email ?? "Account";
  const displayImage = session?.user?.image ?? null;
  const displayInitials = getUserInitials(displayName);
  const [approvalCount, setApprovalCount] = useState(0);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (!isAuthenticated || isLoginPage) return;
    let alive = true;
    const loadCount = async () => {
      try {
        const res = await fetch("/api/approvals/count", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { count: number };
        if (alive) setApprovalCount(data.count ?? 0);
      } catch {
        // ignore
      }
    };
    loadCount();
    const id = setInterval(loadCount, 5000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadCount();
      }
    };
    const handleApprovalRefresh = () => loadCount();
    window.addEventListener("focus", loadCount);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("approval:refresh", handleApprovalRefresh);
    return () => {
      alive = false;
      clearInterval(id);
      window.removeEventListener("focus", loadCount);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("approval:refresh", handleApprovalRefresh);
    };
  }, [isAuthenticated, isLoginPage]);
  const authActionClassName =
    "flex items-center gap-2 rounded-md px-3 py-1.5 transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/60 cursor-pointer";
  const authActionClassNameMobile =
    "flex items-center gap-1 rounded-md px-2 py-1 text-[10px] leading-tight transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/60 cursor-pointer";

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/95 px-4 py-2 backdrop-blur md:hidden">
        {pathname === "/" ? (
          <span className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
            <img src="/logo.svg" alt="Money Tracker" className="h-7 w-7" />
            Money Tracker
          </span>
        ) : (
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground transition-colors hover:text-foreground/80"
          >
            <img src="/logo.svg" alt="Money Tracker" className="h-7 w-7" />
            Money Tracker
          </Link>
        )}
          {!isLoginPage &&
          (isAuthenticated ? (
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className={authActionClassNameMobile}
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          ) : (
            <Link href="/login" className={authActionClassNameMobile}>
              <LogIn className="h-4 w-4" />
              Sign in
            </Link>
          ))}
      </header>

      <header className="sticky top-0 z-40 hidden border-b bg-background/95 backdrop-blur md:block">
        <div className="mx-auto grid h-14 max-w-6xl grid-cols-[auto_1fr_auto] items-center px-4">
          {pathname === "/" ? (
            <span className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground">
              <img src="/logo.svg" alt="Money Tracker" className="h-7 w-7" />
              Money Tracker
            </span>
          ) : (
            <Link
              href="/"
              className="flex items-center gap-2 text-sm font-semibold tracking-tight text-foreground transition-colors hover:text-foreground/80"
            >
              <img src="/logo.svg" alt="Money Tracker" className="h-7 w-7" />
              Money Tracker
            </Link>
          )}
          {isLoginPage ? (
            <>
              <div />
              <div />
            </>
          ) : (
            <>
              <nav className="flex items-center justify-center gap-3 text-sm">
                {navItems.map((item) => {
                  const active = isActive(pathname, item.href);
                  const showBadge =
                    item.href === "/approvals" && approvalCount > 0;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-1.5 transition-colors",
                        active
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                      )}
                    >
                      {item.icon}
                      <span className="flex items-center gap-2">
                        {item.label}
                        {showBadge && (
                          <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-semibold text-white">
                            {approvalCount}
                          </span>
                        )}
                      </span>
                    </Link>
                  );
                })}
              </nav>
              <div className="flex items-center justify-end gap-2 text-sm">
                <button
                  type="button"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  className={cn(
                    "rounded-md px-2 py-1.5 text-muted-foreground transition-colors hover:text-foreground hover:bg-muted/60 cursor-pointer",
                    isAuthenticated ? "mr-1" : ""
                  )}
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4" />
                  ) : (
                    <Moon className="h-4 w-4" />
                  )}
                </button>
                {isAuthenticated && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-foreground hover:bg-muted/60"
                      >
                        <span className="relative">
                          <Avatar className="h-7 w-7">
                            {displayImage ? (
                              <AvatarImage src={displayImage} alt={displayName} />
                            ) : null}
                            <AvatarFallback>{displayInitials}</AvatarFallback>
                          </Avatar>
                          {approvalCount > 0 && (
                            <span className="absolute -right-1 -top-1 rounded-full bg-destructive px-1.5 py-0.5 text-[9px] font-semibold text-white">
                              {approvalCount}
                            </span>
                          )}
                        </span>
                        <span>Hi, {displayName}</span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onSelect={() => router.push("/account")}
                      >
                        Account
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => router.push("/account?tab=approvals")}
                      >
                        <span className="flex items-center gap-2">
                          Approvals
                          {approvalCount > 0 && (
                            <span className="rounded-full bg-destructive px-2 py-0.5 text-[10px] font-semibold text-white">
                              {approvalCount}
                            </span>
                          )}
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => signOut({ callbackUrl: "/login" })}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {!isAuthenticated && (
                  <Link href="/login" className={authActionClassName}>
                    <LogIn className="h-4 w-4" />
                    Sign in
                  </Link>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      {!isLoginPage && (
        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur md:hidden">
          <div className="grid grid-cols-6">
            {navItems.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] leading-tight text-center",
                    active ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {item.icon}
                  <span className="whitespace-normal">
                    {item.mobileLabel ?? item.label}
                  </span>
                </Link>
              );
            })}
            <Link
              href="/account"
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-1 py-2 text-[10px] leading-tight text-center",
                pathname.startsWith("/account")
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              <span className="relative">
                <Avatar className="h-6 w-6">
                  {displayImage ? (
                    <AvatarImage src={displayImage} alt={displayName} />
                  ) : null}
                  <AvatarFallback>{displayInitials}</AvatarFallback>
                </Avatar>
                {approvalCount > 0 && (
                  <span className="absolute -right-1 -top-1 rounded-full bg-destructive px-1 py-0.5 text-[8px] font-semibold text-white">
                    {approvalCount}
                  </span>
                )}
              </span>
              <span className="whitespace-normal">Account</span>
            </Link>
          </div>
        </nav>
      )}
    </>
  );
}
