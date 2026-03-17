"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CreditCard, History, LayoutDashboard, Settings } from "lucide-react";

const navItems = [
  { href: "/dashboard",  label: "一覧",      icon: LayoutDashboard },
  { href: "/analytics",  label: "分析",      icon: BarChart3 },
  { href: "/history",    label: "支払い履歴", icon: History },
  { href: "/settings",   label: "設定",      icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-56 h-screen sticky top-0 z-20 bg-white border-r border-zinc-200">
      {/* ロゴ */}
      <div className="flex items-center gap-3 px-5 h-14 border-b border-zinc-200">
        <div className="w-7 h-7 rounded-lg bg-primary-500 flex items-center justify-center flex-shrink-0">
          <CreditCard size={14} className="text-white" />
        </div>
        <p className="font-bold text-zinc-900 text-sm tracking-tight">サブスク管理</p>
      </div>

      {/* ナビ */}
      <nav className="flex-1 px-2 py-3 space-y-0.5" aria-label="メインナビゲーション">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary-50 text-primary-700"
                  : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100"
              )}
            >
              <Icon size={16} aria-hidden="true" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* フッター */}
      <div className="px-5 py-3 border-t border-zinc-200">
        <p className="text-[10px] text-zinc-400">© 2026 Subscription Manager</p>
      </div>
    </aside>
  );
}
