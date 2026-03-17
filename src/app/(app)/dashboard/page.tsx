"use client";

import { useState, useMemo } from "react";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { SortableHeader } from "@/components/ui/SortableHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { SubscriptionForm } from "@/components/subscription/SubscriptionForm";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { formatCurrency, formatDaysUntil, formatDate } from "@/lib/formatters";
import { BILLING_CYCLE_LABELS } from "@/lib/constants";
import type { SortOrder, SubscriptionWithCalc } from "@/types";
import { Plus, ChevronRight, AlertCircle, Calendar, CreditCard } from "lucide-react";
import Link from "next/link";

type SortKey = "service_name" | "amount" | "next_payment_date" | "status" | "billing_cycle";

export default function DashboardPage() {
  const { subscriptions, loading, error, createSubscription } = useSubscriptions();
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("next_payment_date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const handleSort = (key: string) => {
    if (sortKey === key) setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setSortKey(key as SortKey); setSortOrder("asc"); }
  };

  const sorted = useMemo(() => {
    return [...subscriptions].sort((a, b) => {
      let aVal: string | number = a[sortKey] ?? "";
      let bVal: string | number = b[sortKey] ?? "";
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [subscriptions, sortKey, sortOrder]);

  const active = subscriptions.filter((s) => s.status === "active");
  const monthlyTotal = active.reduce((sum, s) => sum + s.monthly_amount, 0);
  const yearlyTotal = active.reduce((sum, s) => sum + s.yearly_amount, 0);
  const soonCount = active.filter((s) => s.days_until_next_payment >= 0 && s.days_until_next_payment <= 7).length;

  const handleCreate = async (values: Parameters<typeof createSubscription>[0]) => {
    try {
      setCreateError(null);
      await createSubscription(values);
      setCreateOpen(false);
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "登録に失敗しました");
    }
  };

  return (
    <>
      <Header title="サブスクリプション一覧" />
      <div className="p-4 md:p-6 space-y-5">

        {/* サマリー */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard label="管理中" value={`${active.length}件`} />
          <MetricCard label="月間合計" value={formatCurrency(monthlyTotal)} accent />
          <MetricCard label="年間合計" value={formatCurrency(yearlyTotal)} />
          <MetricCard label="今週の支払い" value={`${soonCount}件`} warn={soonCount > 0} />
        </div>

        {/* テーブル */}
        <Card padding="none">
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">すべて</h2>
              <p className="text-xs text-zinc-400 mt-0.5">{subscriptions.length}件のサービス</p>
            </div>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus size={14} aria-hidden="true" />新規登録
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><LoadingSpinner /></div>
          ) : error ? (
            <div className="flex items-center gap-2 text-sm text-red-600 p-6" role="alert">
              <AlertCircle size={16} aria-hidden="true" />{error}
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto mb-3">
                <CreditCard size={22} className="text-zinc-400" aria-hidden="true" />
              </div>
              <p className="text-zinc-500 text-sm">サブスクリプションが登録されていません</p>
              <Button size="sm" className="mt-4" onClick={() => setCreateOpen(true)}>
                <Plus size={14} aria-hidden="true" />最初のサービスを追加
              </Button>
            </div>
          ) : (
            <>
              {/* デスクトップテーブル */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/60">
                      {[
                        { key: "service_name",      label: "サービス名" },
                        { key: "billing_cycle",     label: "サイクル" },
                        { key: "amount",            label: "金額" },
                        { key: "next_payment_date", label: "次回支払日" },
                        { key: "status",            label: "ステータス" },
                      ].map(({ key, label }) => (
                        <th key={key} className={`px-6 py-3 text-left ${key === "amount" ? "text-right" : ""}`}>
                          <SortableHeader label={label} sortKey={key} currentKey={sortKey} currentOrder={sortOrder} onSort={handleSort} />
                        </th>
                      ))}
                      <th className="px-6 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {sorted.map((sub) => <SubscriptionRow key={sub.id} sub={sub} />)}
                  </tbody>
                </table>
              </div>

              {/* モバイルカード */}
              <div className="md:hidden divide-y divide-zinc-100">
                {sorted.map((sub) => <SubscriptionMobileCard key={sub.id} sub={sub} />)}
              </div>
            </>
          )}
        </Card>
      </div>

      <Modal open={createOpen} onClose={() => { setCreateOpen(false); setCreateError(null); }} title="サブスクリプションを登録" size="lg">
        {createError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2" role="alert">
            <AlertCircle size={15} aria-hidden="true" />{createError}
          </div>
        )}
        <SubscriptionForm onSubmit={handleCreate} onCancel={() => { setCreateOpen(false); setCreateError(null); }} submitLabel="登録する" />
      </Modal>
    </>
  );
}

function MetricCard({ label, value, accent = false, warn = false }: { label: string; value: string; accent?: boolean; warn?: boolean }) {
  return (
    <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-card">
      <p className="text-xs text-zinc-400 mb-1.5 font-medium">{label}</p>
      <p className={`text-xl font-bold tabnum tracking-tight ${accent ? "text-primary-600" : warn ? "text-amber-600" : "text-zinc-900"}`}>
        {value}
      </p>
    </div>
  );
}

function SubscriptionRow({ sub }: { sub: SubscriptionWithCalc }) {
  const isSoon = sub.status === "active" && sub.days_until_next_payment >= 0 && sub.days_until_next_payment <= 7;
  return (
    // has-[a:focus-visible] でキーボードフォーカス時に行全体にリングを表示
    <tr className="relative hover:bg-zinc-50 transition-colors cursor-pointer group has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-inset has-[a:focus-visible]:ring-primary-500">
      <td className="px-6 py-3.5">
        <div className="flex items-center gap-2">
          {sub.categories ? (
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: sub.categories.color }} aria-hidden="true" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-zinc-300 flex-shrink-0" aria-hidden="true" />
          )}
          {/*
            after:absolute after:inset-0 でクリック領域を行全体に拡張（Stretchy Link パターン）
            focus-visible:outline-none でデフォルトアウトラインを無効化（親 <tr> 側で表示）
          */}
          <Link
            href={`/subscriptions/${sub.id}`}
            aria-label={`${sub.service_name}の詳細を開く`}
            className="text-sm font-medium text-zinc-900 group-hover:text-primary-600 transition-colors after:absolute after:inset-0 focus-visible:outline-none"
          >
            {sub.service_name}
          </Link>
        </div>
        {sub.categories && (
          // z-10 で stretchy link の after 要素より前面に置き、バッジ自体はクリック可
          <Badge color={sub.categories.color} className="mt-1 ml-4 relative z-10">{sub.categories.name}</Badge>
        )}
      </td>
      <td className="px-6 py-3.5 text-sm text-zinc-500">{BILLING_CYCLE_LABELS[sub.billing_cycle]}</td>
      <td className="px-6 py-3.5 text-sm font-semibold text-zinc-900 text-right tabnum">{formatCurrency(sub.amount)}</td>
      <td className="px-6 py-3.5">
        <div className="flex items-center gap-1.5">
          <Calendar size={13} className="text-zinc-400" aria-hidden="true" />
          <span className="text-sm text-zinc-600">{formatDate(sub.next_payment_date)}</span>
        </div>
        <p className={`text-xs mt-0.5 ml-5 ${isSoon ? "text-amber-600 font-medium" : "text-zinc-400"}`}>
          {formatDaysUntil(sub.days_until_next_payment)}
        </p>
      </td>
      <td className="px-6 py-3.5"><StatusBadge status={sub.status} /></td>
      <td className="px-6 py-3.5">
        {/* 矢印は視覚的インジケーターのみ（行全体がリンクのため aria-hidden） */}
        <ChevronRight size={18} className="text-zinc-300 group-hover:text-primary-500 transition-colors" aria-hidden="true" />
      </td>
    </tr>
  );
}

function SubscriptionMobileCard({ sub }: { sub: SubscriptionWithCalc }) {
  const isSoon = sub.status === "active" && sub.days_until_next_payment >= 0 && sub.days_until_next_payment <= 7;
  return (
    <Link href={`/subscriptions/${sub.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-zinc-50 transition-colors" aria-label={`${sub.service_name} — ${formatCurrency(sub.amount)}`}>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-zinc-100"
           style={sub.categories?.color ? { backgroundColor: `${sub.categories.color}18` } : undefined}>
        <span className="text-xs font-bold text-zinc-500" style={{ color: sub.categories?.color ?? undefined }} aria-hidden="true">
          {sub.service_name.slice(0, 2)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-zinc-900 truncate">{sub.service_name}</span>
          <StatusBadge status={sub.status} className="flex-shrink-0" />
        </div>
        <p className="text-xs text-zinc-400 mt-0.5">
          {formatDate(sub.next_payment_date)} ·{" "}
          <span className={isSoon ? "text-amber-600 font-medium" : ""}>{formatDaysUntil(sub.days_until_next_payment)}</span>
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-zinc-900 tabnum">{formatCurrency(sub.amount)}</p>
        <p className="text-xs text-zinc-400">{BILLING_CYCLE_LABELS[sub.billing_cycle]}</p>
      </div>
      <ChevronRight size={15} className="text-zinc-300 flex-shrink-0" aria-hidden="true" />
    </Link>
  );
}
