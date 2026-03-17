"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, History, LayoutDashboard, Settings } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "一覧", icon: LayoutDashboard },
  { href: "/analytics", label: "分析", icon: BarChart3 },
  { href: "/history", label: "履歴", icon: History },
  { href: "/settings", label: "設定", icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 z-20">
      <div className="flex">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-3 text-xs transition-colors",
                isActive ? "text-primary" : "text-ink-lighter"
              )}
            >
              <Icon size={20} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
