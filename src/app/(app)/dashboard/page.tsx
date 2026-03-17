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
import { Plus, ChevronRight, AlertCircle } from "lucide-react";
import Link from "next/link";

type SortKey = "service_name" | "amount" | "next_payment_date" | "status" | "billing_cycle";

export default function DashboardPage() {
  const { subscriptions, loading, error, createSubscription } = useSubscriptions();
  const [createOpen, setCreateOpen] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("next_payment_date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key as SortKey);
      setSortOrder("asc");
    }
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

  const handleCreate = async (values: Parameters<typeof createSubscription>[0]) => {
    await createSubscription(values);
    setCreateOpen(false);
  };

  return (
    <>
      <Header title="サブスクリプション一覧" />
      <div className="p-6">
        {/* サマリー */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <SummaryCard
            label="管理中"
            value={`${subscriptions.filter((s) => s.status === "active").length}件`}
            color="text-secondary"
          />
          <SummaryCard
            label="月間合計"
            value={formatCurrency(
              subscriptions
                .filter((s) => s.status === "active")
                .reduce((sum, s) => sum + s.monthly_amount, 0)
            )}
            color="text-primary"
          />
          <SummaryCard
            label="年間合計"
            value={formatCurrency(
              subscriptions
                .filter((s) => s.status === "active")
                .reduce((sum, s) => sum + s.yearly_amount, 0)
            )}
            color="text-primary"
          />
          <SummaryCard
            label="今週の支払い"
            value={`${subscriptions.filter((s) => s.status === "active" && s.days_until_next_payment >= 0 && s.days_until_next_payment <= 7).length}件`}
            color="text-accent"
          />
        </div>

        {/* テーブル */}
        <Card padding="none">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-ink">
              すべて ({subscriptions.length})
            </h2>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus size={15} />
              新規登録
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-sm text-red-500 p-6">
              <AlertCircle size={16} />
              {error}
            </div>
          ) : subscriptions.length === 0 ? (
            <div className="text-center py-16 text-ink-lighter text-sm">
              サブスクリプションが登録されていません
            </div>
          ) : (
            <>
              {/* デスクトップ：テーブル */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-5 py-3">
                        <SortableHeader label="サービス名" sortKey="service_name" currentKey={sortKey} currentOrder={sortOrder} onSort={handleSort} />
                      </th>
                      <th className="text-left px-5 py-3">
                        <SortableHeader label="サイクル" sortKey="billing_cycle" currentKey={sortKey} currentOrder={sortOrder} onSort={handleSort} />
                      </th>
                      <th className="text-right px-5 py-3">
                        <SortableHeader label="金額" sortKey="amount" currentKey={sortKey} currentOrder={sortOrder} onSort={handleSort} />
                      </th>
                      <th className="text-left px-5 py-3">
                        <SortableHeader label="次回支払日" sortKey="next_payment_date" currentKey={sortKey} currentOrder={sortOrder} onSort={handleSort} />
                      </th>
                      <th className="text-left px-5 py-3">
                        <SortableHeader label="ステータス" sortKey="status" currentKey={sortKey} currentOrder={sortOrder} onSort={handleSort} />
                      </th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((sub) => (
                      <SubscriptionRow key={sub.id} sub={sub} />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* モバイル：カード */}
              <div className="md:hidden divide-y divide-gray-100">
                {sorted.map((sub) => (
                  <SubscriptionMobileCard key={sub.id} sub={sub} />
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      {/* 新規作成モーダル */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="サブスクリプションを登録"
        size="lg"
      >
        <SubscriptionForm
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
          submitLabel="登録する"
        />
      </Modal>
    </>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <Card padding="sm">
      <p className="text-xs text-ink-lighter mb-1">{label}</p>
      <p className={`text-lg font-bold ${color}`}>{value}</p>
    </Card>
  );
}

function SubscriptionRow({ sub }: { sub: SubscriptionWithCalc }) {
  const isSoon = sub.status === "active" && sub.days_until_next_payment >= 0 && sub.days_until_next_payment <= 7;
  return (
    <tr className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
      <td className="px-5 py-3.5">
        <div className="flex items-center gap-2">
          {sub.categories && (
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: sub.categories.color }}
            />
          )}
          <span className="text-sm font-medium text-ink">{sub.service_name}</span>
        </div>
        {sub.categories && (
          <Badge color={sub.categories.color} className="mt-1">
            {sub.categories.name}
          </Badge>
        )}
      </td>
      <td className="px-5 py-3.5 text-sm text-ink-light">
        {BILLING_CYCLE_LABELS[sub.billing_cycle]}
      </td>
      <td className="px-5 py-3.5 text-sm font-medium text-ink text-right">
        {formatCurrency(sub.amount)}
      </td>
      <td className="px-5 py-3.5">
        <p className="text-sm text-ink">{formatDate(sub.next_payment_date)}</p>
        <p className={`text-xs mt-0.5 ${isSoon ? "text-accent font-medium" : "text-ink-lighter"}`}>
          {formatDaysUntil(sub.days_until_next_payment)}
        </p>
      </td>
      <td className="px-5 py-3.5">
        <StatusBadge status={sub.status} />
      </td>
      <td className="px-5 py-3.5">
        <Link href={`/subscriptions/${sub.id}`} className="text-ink-lighter hover:text-primary transition-colors">
          <ChevronRight size={18} />
        </Link>
      </td>
    </tr>
  );
}

function SubscriptionMobileCard({ sub }: { sub: SubscriptionWithCalc }) {
  const isSoon = sub.status === "active" && sub.days_until_next_payment >= 0 && sub.days_until_next_payment <= 7;
  return (
    <Link href={`/subscriptions/${sub.id}`} className="flex items-center gap-3 px-5 py-4 hover:bg-gray-50/50">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          {sub.categories && (
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: sub.categories.color }} />
          )}
          <span className="text-sm font-medium text-ink truncate">{sub.service_name}</span>
          <StatusBadge status={sub.status} className="ml-auto flex-shrink-0" />
        </div>
        <p className="text-xs text-ink-lighter">
          {formatDate(sub.next_payment_date)} ·{" "}
          <span className={isSoon ? "text-accent font-medium" : ""}>
            {formatDaysUntil(sub.days_until_next_payment)}
          </span>
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-semibold text-ink">{formatCurrency(sub.amount)}</p>
        <p className="text-xs text-ink-lighter">{BILLING_CYCLE_LABELS[sub.billing_cycle]}</p>
      </div>
      <ChevronRight size={16} className="text-ink-lighter flex-shrink-0" />
    </Link>
  );
}
