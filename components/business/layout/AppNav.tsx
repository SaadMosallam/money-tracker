"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  ArrowRightLeft,
  LayoutDashboard,
  PlusCircle,
  Receipt,
  BanknoteArrowUp,
  User,
  LogIn,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserInitials } from "@/lib/utils/userInitials";

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
  {
    href: "/account",
    label: "Account",
    mobileLabel: "Account",
    icon: <User className="h-4 w-4" />,
  },
];

const isActive = (pathname: string, href: string) => {
  return pathname === href;
};

export function AppNav() {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const displayName = session?.user?.name ?? session?.user?.email ?? "Account";
  const displayImage = session?.user?.image ?? null;
  const displayInitials = getUserInitials(displayName);
  const authActionClassName =
    "flex items-center gap-2 rounded-md px-3 py-1.5 transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/60 cursor-pointer";
  const authActionClassNameMobile =
    "flex items-center gap-1 rounded-md px-2 py-1 text-[10px] leading-tight transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/60 cursor-pointer";

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between border-b bg-background/95 px-4 py-2 backdrop-blur md:hidden">
        {pathname === "/" ? (
          <span className="text-sm font-semibold tracking-tight text-foreground">
            Money Tracker
          </span>
        ) : (
          <Link
            href="/"
            className="text-sm font-semibold tracking-tight text-foreground transition-colors hover:text-foreground/80"
          >
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
            <span className="text-sm font-semibold tracking-tight text-foreground">
              Money Tracker
            </span>
          ) : (
            <Link
              href="/"
              className="text-sm font-semibold tracking-tight text-foreground transition-colors hover:text-foreground/80"
            >
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
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="flex items-center justify-end gap-2 text-sm">
                {isAuthenticated && (
                  <span className="flex items-center gap-2 text-foreground">
                    <Avatar className="h-7 w-7">
                      {displayImage ? (
                        <AvatarImage src={displayImage} alt={displayName} />
                      ) : null}
                      <AvatarFallback>{displayInitials}</AvatarFallback>
                    </Avatar>
                    Hi, {displayName}
                  </span>
                )}
                {isAuthenticated ? (
                  <button
                    type="button"
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className={authActionClassName}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </button>
                ) : (
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
          </div>
        </nav>
      )}
    </>
  );
}
