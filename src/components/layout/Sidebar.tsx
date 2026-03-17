"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  CreditCard,
  History,
  LayoutDashboard,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "一覧", icon: LayoutDashboard },
  { href: "/analytics", label: "分析", icon: BarChart3 },
  { href: "/history", label: "支払い履歴", icon: History },
  { href: "/settings", label: "設定", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-100 h-screen sticky top-0">
      {/* ロゴ */}
      <div className="flex items-center gap-2.5 px-5 h-16 border-b border-gray-100">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
          <CreditCard size={16} className="text-white" />
        </div>
        <span className="font-bold text-ink text-sm">サブスク管理</span>
      </div>

      {/* ナビ */}
      <nav className="flex-1 p-3 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-primary text-white font-medium"
                  : "text-ink-light hover:bg-gray-50 hover:text-ink"
              )}
            >
              <Icon size={17} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
