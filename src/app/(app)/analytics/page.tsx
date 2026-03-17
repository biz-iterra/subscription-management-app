"use client";

import { useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { formatCurrency } from "@/lib/formatters";
import type { PieChartData } from "@/types";
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const UNCATEGORIZED_COLOR = "#D1D5DB";
const SERVICE_COLORS = [
  "#6366F1","#10B981","#F59E0B","#EF4444","#8B5CF6",
  "#EC4899","#06B6D4","#84CC16","#F97316","#3B82F6",
];

const TOOLTIP_STYLE = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
  fontSize: "12px",
  color: "#111827",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

type Period = "monthly" | "yearly";
type GroupBy = "service" | "category";

export default function AnalyticsPage() {
  const { subscriptions, loading } = useSubscriptions();
  const [period, setPeriod] = useState<Period>("monthly");
  const [groupBy, setGroupBy] = useState<GroupBy>("service");

  const pieData = useMemo<PieChartData[]>(() => {
    const active = subscriptions.filter((s) => s.status === "active");
    const total = active.reduce((sum, s) => sum + (period === "monthly" ? s.monthly_amount : s.yearly_amount), 0);
    if (total === 0) return [];

    if (groupBy === "service") {
      return active.map((sub, i) => {
        const value = period === "monthly" ? sub.monthly_amount : sub.yearly_amount;
        return { name: sub.service_name, value, color: sub.categories?.color ?? SERVICE_COLORS[i % SERVICE_COLORS.length], percentage: Math.round((value / total) * 100) };
      }).sort((a, b) => b.value - a.value);
    } else {
      const map = new Map<string, { name: string; value: number; color: string }>();
      for (const sub of active) {
        const key = sub.category_id ?? "__uncategorized__";
        const amount = period === "monthly" ? sub.monthly_amount : sub.yearly_amount;
        if (map.has(key)) map.get(key)!.value += amount;
        else map.set(key, { name: sub.categories?.name ?? "未分類", value: amount, color: sub.categories?.color ?? UNCATEGORIZED_COLOR });
      }
      return Array.from(map.values()).sort((a, b) => b.value - a.value).map((item) => ({ ...item, percentage: Math.round((item.value / total) * 100) }));
    }
  }, [subscriptions, period, groupBy]);

  const total = pieData.reduce((sum, d) => sum + d.value, 0);

  return (
    <>
      <Header title="分析" />
      <div className="p-6 space-y-5 max-w-3xl">

        {/* コントロール */}
        <div className="flex flex-wrap gap-3">
          <div className="flex bg-white border border-zinc-200 rounded-lg p-0.5 shadow-card" role="group" aria-label="期間">
            {(["monthly", "yearly"] as Period[]).map((p) => (
              <button key={p} onClick={() => setPeriod(p)} aria-pressed={period === p}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${period === p ? "bg-primary-500 text-white" : "text-zinc-500 hover:text-zinc-900"}`}>
                {p === "monthly" ? "月間" : "年間"}
              </button>
            ))}
          </div>

          <div className="flex bg-white border border-zinc-200 rounded-lg p-0.5 shadow-card" role="group" aria-label="グループ">
            {([["service", "サービス別"], ["category", "カテゴリ別"]] as [GroupBy, string][]).map(([g, label]) => (
              <button key={g} onClick={() => setGroupBy(g)} aria-pressed={groupBy === g}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${groupBy === g ? "bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-900"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : pieData.length === 0 ? (
          <Card><div className="text-center py-12 text-zinc-400 text-sm">利用中のサブスクリプションがありません</div></Card>
        ) : (
          <>
            {/* 合計 */}
            <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-card">
              <p className="text-xs text-zinc-400 mb-1 font-medium">{period === "monthly" ? "月間" : "年間"}合計</p>
              <p className="text-3xl font-bold text-zinc-900 tabnum tracking-tight">{formatCurrency(total)}</p>
            </div>

            {/* 円グラフ */}
            <Card>
              <CardHeader><CardTitle>{groupBy === "service" ? "サービス" : "カテゴリ"}別内訳</CardTitle></CardHeader>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={2} dataKey="value">
                      {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(value: number, _key: string, props: { payload?: { name?: string } }) => [formatCurrency(value), props.payload?.name ?? ""]} contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#6B7280" }} />
                    <Legend formatter={(value) => <span style={{ fontSize: "12px", color: "#6B7280" }}>{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* 内訳リスト */}
            <Card padding="none">
              <div className="px-5 py-4 border-b border-zinc-100"><CardTitle>内訳詳細</CardTitle></div>
              <ul className="divide-y divide-zinc-100">
                {pieData.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 px-5 py-3.5 hover:bg-zinc-50 transition-colors">
                    <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: item.color }} aria-hidden="true" />
                    <span className="flex-1 text-sm text-zinc-800">{item.name}</span>
                    <span className="text-xs text-zinc-400 font-medium w-10 text-right">{item.percentage}%</span>
                    <span className="text-sm font-semibold text-zinc-900 tabnum w-24 text-right">{formatCurrency(item.value)}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </>
        )}
      </div>
    </>
  );
}
