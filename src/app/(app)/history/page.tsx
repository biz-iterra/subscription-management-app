"use client";

import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatYearMonth } from "@/lib/formatters";
import { subMonths, format } from "date-fns";
import type { MonthlyBarData } from "@/types";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function HistoryPage() {
  const [data, setData] = useState<MonthlyBarData[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const fetch = async () => {
      const today = new Date();
      const from = format(subMonths(today, 11), "yyyy-MM-01");

      const { data: logs } = await supabase
        .from("payment_logs")
        .select("payment_date, amount")
        .gte("payment_date", from)
        .order("payment_date", { ascending: true });

      // 過去12ヶ月の月リストを生成
      const months: MonthlyBarData[] = Array.from({ length: 12 }, (_, i) => {
        const d = subMonths(today, 11 - i);
        const month = format(d, "yyyy-MM");
        return {
          month,
          label: format(d, "M月"),
          total: 0,
        };
      });

      // ログを月ごとに集計
      for (const log of logs ?? []) {
        const month = log.payment_date.slice(0, 7);
        const entry = months.find((m) => m.month === month);
        if (entry) entry.total += Number(log.amount);
      }

      setData(months);
      setLoading(false);
    };
    fetch();
  }, [supabase]);

  const totalLast12 = useMemo(
    () => data.reduce((sum, d) => sum + d.total, 0),
    [data]
  );
  const avgMonthly = useMemo(
    () => (data.length > 0 ? totalLast12 / data.length : 0),
    [totalLast12, data]
  );

  return (
    <>
      <Header title="支払い履歴" />
      <div className="p-6 space-y-5 max-w-3xl">
        {loading ? (
          <div className="flex justify-center py-16">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {/* サマリー */}
            <div className="grid grid-cols-2 gap-4">
              <Card padding="sm">
                <p className="text-xs text-ink-lighter mb-1">過去12ヶ月合計</p>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(totalLast12)}
                </p>
              </Card>
              <Card padding="sm">
                <p className="text-xs text-ink-lighter mb-1">月平均</p>
                <p className="text-2xl font-bold text-ink">
                  {formatCurrency(Math.round(avgMonthly))}
                </p>
              </Card>
            </div>

            {/* 棒グラフ */}
            <Card>
              <CardHeader>
                <CardTitle>月次支払い額（過去12ヶ月）</CardTitle>
              </CardHeader>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data}
                    margin={{ top: 4, right: 4, left: 8, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 11, fill: "#94A3B8" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "#94A3B8" }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        formatCurrency(value),
                        "支払額",
                      ]}
                      labelFormatter={(label) => `${label}`}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #E2E8F0",
                        fontSize: "12px",
                      }}
                    />
                    <Bar
                      dataKey="total"
                      fill="#4F46E5"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* 月次一覧 */}
            <Card padding="none">
              <div className="px-5 py-4 border-b border-gray-100">
                <CardTitle>月次明細</CardTitle>
              </div>
              <ul className="divide-y divide-gray-50">
                {[...data].reverse().map((item) => (
                  <li key={item.month} className="flex items-center justify-between px-5 py-3.5">
                    <span className="text-sm text-ink">
                      {formatYearMonth(item.month)}
                    </span>
                    <span className={`text-sm font-semibold ${item.total > 0 ? "text-ink" : "text-ink-lighter"}`}>
                      {item.total > 0 ? formatCurrency(item.total) : "-"}
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
