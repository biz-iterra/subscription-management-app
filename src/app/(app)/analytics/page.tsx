"use client";

import { useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { formatCurrency } from "@/lib/formatters";
import type { PieChartData } from "@/types";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const UNCATEGORIZED_COLOR = "#94A3B8";

type Period = "monthly" | "yearly";

export default function AnalyticsPage() {
  const { subscriptions, loading } = useSubscriptions();
  const [period, setPeriod] = useState<Period>("monthly");

  const pieData = useMemo<PieChartData[]>(() => {
    const active = subscriptions.filter((s) => s.status === "active");
    const total = active.reduce(
      (sum, s) =>
        sum + (period === "monthly" ? s.monthly_amount : s.yearly_amount),
      0
    );
    if (total === 0) return [];

    // カテゴリ別に集計
    const map = new Map<
      string,
      { name: string; value: number; color: string }
    >();

    for (const sub of active) {
      const key = sub.category_id ?? "__uncategorized__";
      const name = sub.categories?.name ?? "未分類";
      const color = sub.categories?.color ?? UNCATEGORIZED_COLOR;
      const amount =
        period === "monthly" ? sub.monthly_amount : sub.yearly_amount;

      if (map.has(key)) {
        map.get(key)!.value += amount;
      } else {
        map.set(key, { name, value: amount, color });
      }
    }

    return Array.from(map.values())
      .sort((a, b) => b.value - a.value)
      .map((item) => ({
        ...item,
        percentage: Math.round((item.value / total) * 100),
      }));
  }, [subscriptions, period]);

  const total = pieData.reduce((sum, d) => sum + d.value, 0);

  return (
    <>
      <Header title="分析" />
      <div className="p-6 space-y-5 max-w-3xl">
        {/* 期間タブ */}
        <div className="inline-flex bg-white border border-gray-200 rounded-lg p-1">
          {(["monthly", "yearly"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-1.5 text-sm rounded-md font-medium transition-colors ${
                period === p
                  ? "bg-primary text-white"
                  : "text-ink-light hover:text-ink"
              }`}
            >
              {p === "monthly" ? "月間" : "年間"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : pieData.length === 0 ? (
          <Card>
            <div className="text-center py-12 text-ink-lighter text-sm">
              利用中のサブスクリプションがありません
            </div>
          </Card>
        ) : (
          <>
            {/* 合計 */}
            <Card padding="sm">
              <p className="text-sm text-ink-lighter">
                {period === "monthly" ? "月間" : "年間"}合計
              </p>
              <p className="text-3xl font-bold text-primary mt-1">
                {formatCurrency(total)}
              </p>
            </Card>

            {/* 円グラフ */}
            <Card>
              <CardHeader>
                <CardTitle>カテゴリ内訳</CardTitle>
              </CardHeader>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={110}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number) => [
                        formatCurrency(value),
                        "",
                      ]}
                    />
                    <Legend
                      formatter={(value) => (
                        <span className="text-xs text-ink">{value}</span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* 内訳リスト */}
            <Card padding="none">
              <div className="px-5 py-4 border-b border-gray-100">
                <CardTitle>内訳詳細</CardTitle>
              </div>
              <ul className="divide-y divide-gray-50">
                {pieData.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 px-5 py-3.5">
                    <span
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="flex-1 text-sm text-ink">{item.name}</span>
                    <span className="text-xs text-ink-lighter">
                      {item.percentage}%
                    </span>
                    <span className="text-sm font-semibold text-ink">
                      {formatCurrency(item.value)}
                    </span>
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
