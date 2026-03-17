"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { createClient } from "@/lib/supabase/client";
import { formatCurrency, formatYearMonth } from "@/lib/formatters";
import { subMonths, format } from "date-fns";
import type { MonthlyBarData } from "@/types";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const TOOLTIP_STYLE = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
  fontSize: "12px",
  color: "#111827",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
};

export default function HistoryPage() {
  const [data, setData] = useState<MonthlyBarData[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useRef(createClient()).current;

  useEffect(() => {
    const fetch = async () => {
      const today = new Date();
      const from = format(subMonths(today, 11), "yyyy-MM-01");
      const { data: logs } = await supabase.from("payment_logs").select("payment_date, amount").gte("payment_date", from).order("payment_date", { ascending: true });

      const months: MonthlyBarData[] = Array.from({ length: 12 }, (_, i) => {
        const d = subMonths(today, 11 - i);
        return { month: format(d, "yyyy-MM"), label: format(d, "M月"), total: 0 };
      });
      for (const log of logs ?? []) {
        const entry = months.find((m) => m.month === log.payment_date.slice(0, 7));
        if (entry) entry.total += Number(log.amount);
      }
      setData(months);
      setLoading(false);
    };
    fetch();
  }, [supabase]);

  const totalLast12 = useMemo(() => data.reduce((sum, d) => sum + d.total, 0), [data]);
  const avgMonthly = useMemo(() => (data.length > 0 ? totalLast12 / data.length : 0), [totalLast12, data]);

  return (
    <>
      <Header title="支払い履歴" />
      <div className="p-6 space-y-5 max-w-3xl">
        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner /></div>
        ) : (
          <>
            {/* サマリー */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-card">
                <p className="text-xs text-zinc-400 mb-1 font-medium">過去12ヶ月合計</p>
                <p className="text-2xl font-bold text-zinc-900 tabnum tracking-tight">{formatCurrency(totalLast12)}</p>
              </div>
              <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-card">
                <p className="text-xs text-zinc-400 mb-1 font-medium">月平均</p>
                <p className="text-2xl font-bold text-primary-600 tabnum tracking-tight">{formatCurrency(Math.round(avgMonthly))}</p>
              </div>
            </div>

            {/* 棒グラフ */}
            <Card>
              <CardHeader><CardTitle>月次支払い額（過去12ヶ月）</CardTitle></CardHeader>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data} margin={{ top: 4, right: 4, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} tickFormatter={(v) => `¥${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value: number) => [formatCurrency(value), "支払額"]} contentStyle={TOOLTIP_STYLE} labelStyle={{ color: "#6B7280" }} cursor={{ fill: "rgba(99,102,241,0.06)" }} />
                    <Bar dataKey="total" fill="#6366F1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* 月次一覧 */}
            <Card padding="none">
              <div className="px-5 py-4 border-b border-zinc-100"><CardTitle>月次明細</CardTitle></div>
              <ul className="divide-y divide-zinc-100">
                {[...data].reverse().map((item) => (
                  <li key={item.month} className="flex items-center justify-between px-5 py-3.5 hover:bg-zinc-50 transition-colors">
                    <span className="text-sm text-zinc-600">{formatYearMonth(item.month)}</span>
                    <span className={`text-sm font-semibold tabnum ${item.total > 0 ? "text-zinc-900" : "text-zinc-300"}`}>
                      {item.total > 0 ? formatCurrency(item.total) : "—"}
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
