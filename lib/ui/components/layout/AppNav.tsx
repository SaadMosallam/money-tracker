"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ListOrdered,
  PlusCircle,
  Receipt,
  ArrowRightLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", icon: <LayoutDashboard className="h-4 w-4" /> },
  { href: "/expenses", label: "Expenses", icon: <Receipt className="h-4 w-4" /> },
  { href: "/payments", label: "Payments", icon: <ArrowRightLeft className="h-4 w-4" /> },
  { href: "/expenses/new", label: "New Expense", icon: <PlusCircle className="h-4 w-4" /> },
  { href: "/payments/new", label: "New Payment", icon: <ListOrdered className="h-4 w-4" /> },
];

const isActive = (pathname: string, href: string) => {
  return pathname === href;
};

export function AppNav() {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-40 hidden border-b bg-background/95 backdrop-blur md:block">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
          <div className="text-sm font-semibold tracking-tight">Money Tracker</div>
          <nav className="flex items-center gap-3 text-sm">
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
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-5">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 px-2 py-2 text-xs",
                  active ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
