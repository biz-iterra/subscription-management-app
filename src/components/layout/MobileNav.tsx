"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, History, LayoutDashboard, Settings } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "一覧",  icon: LayoutDashboard },
  { href: "/analytics", label: "分析",  icon: BarChart3 },
  { href: "/history",   label: "履歴",  icon: History },
  { href: "/settings",  label: "設定",  icon: Settings },
];

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-20 bg-white border-t border-zinc-200 pb-safe" aria-label="モバイルナビゲーション">
      <div className="flex">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors",
                isActive ? "text-primary-600" : "text-zinc-400 hover:text-zinc-600"
              )}
            >
              <Icon size={20} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
