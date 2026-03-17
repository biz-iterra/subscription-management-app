"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge, Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { SortableHeader } from "@/components/ui/SortableHeader";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { SubscriptionForm } from "@/components/subscription/SubscriptionForm";
import { useSubscription, useSubscriptions } from "@/hooks/useSubscriptions";
import { usePaymentLogs } from "@/hooks/usePaymentLogs";
import {
  formatCurrency,
  formatDate,
  formatDaysUntil,
  formatElapsed,
} from "@/lib/formatters";
import { BILLING_CYCLE_LABELS } from "@/lib/constants";
import type { SortOrder } from "@/types";
import { ArrowLeft, Edit, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

export default function SubscriptionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { subscription, loading } = useSubscription(id);
  const { updateSubscription, deleteSubscription } = useSubscriptions();
  const { logs, loading: logsLoading, create: createLog, remove: removeLog } = usePaymentLogs(id);

  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [addLogOpen, setAddLogOpen] = useState(false);
  const [logSortKey, setLogSortKey] = useState<"payment_date" | "amount">("payment_date");
  const [logSortOrder, setLogSortOrder] = useState<SortOrder>("desc");

  const handleLogSort = (key: string) => {
    if (logSortKey === key) {
      setLogSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setLogSortKey(key as "payment_date" | "amount");
      setLogSortOrder("asc");
    }
  };

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      const aVal = a[logSortKey];
      const bVal = b[logSortKey];
      if (aVal < bVal) return logSortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return logSortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [logs, logSortKey, logSortOrder]);

  const handleDelete = async () => {
    await deleteSubscription(id);
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <>
        <Header title="詳細" />
        <div className="flex justify-center py-16">
          <LoadingSpinner />
        </div>
      </>
    );
  }

  if (!subscription) {
    return (
      <>
        <Header title="詳細" />
        <div className="p-6 text-sm text-ink-light">見つかりませんでした</div>
      </>
    );
  }

  const isSoon =
    subscription.status === "active" &&
    subscription.days_until_next_payment >= 0 &&
    subscription.days_until_next_payment <= 7;

  return (
    <>
      <Header title="詳細" />
      <div className="p-6 space-y-5 max-w-3xl">
        {/* 戻るリンク */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-ink-light hover:text-ink transition-colors"
        >
          <ArrowLeft size={15} />
          一覧へ戻る
        </Link>

        {/* メインカード */}
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                {subscription.categories && (
                  <Badge color={subscription.categories.color}>
                    {subscription.categories.name}
                  </Badge>
                )}
                <StatusBadge status={subscription.status} />
              </div>
              <h2 className="text-xl font-bold text-ink">
                {subscription.service_name}
              </h2>
              {subscription.memo && (
                <p className="text-sm text-ink-light mt-2 whitespace-pre-line">
                  {subscription.memo}
                </p>
              )}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditOpen(true)}
              >
                <Edit size={14} />
                編集
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => setDeleteConfirm(true)}
              >
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        </Card>

        {/* 数値サマリー */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card padding="sm">
            <p className="text-xs text-ink-lighter mb-1">
              {BILLING_CYCLE_LABELS[subscription.billing_cycle]}料金
            </p>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(subscription.amount)}
            </p>
          </Card>
          <Card padding="sm">
            <p className="text-xs text-ink-lighter mb-1">次回支払日</p>
            <p className="text-sm font-semibold text-ink">
              {formatDate(subscription.next_payment_date)}
            </p>
            <p
              className={`text-xs mt-0.5 ${isSoon ? "text-accent font-medium" : "text-ink-lighter"}`}
            >
              {formatDaysUntil(subscription.days_until_next_payment)}
            </p>
          </Card>
          <Card padding="sm">
            <p className="text-xs text-ink-lighter mb-1">累計支払額</p>
            <p className="text-lg font-bold text-ink">
              {formatCurrency(subscription.total_paid_amount)}
            </p>
          </Card>
          <Card padding="sm">
            <p className="text-xs text-ink-lighter mb-1">利用開始から</p>
            <p className="text-sm font-semibold text-ink">
              {formatElapsed(subscription.first_payment_date)}
            </p>
            <p className="text-xs text-ink-lighter mt-0.5">
              {formatDate(subscription.first_payment_date)}〜
            </p>
          </Card>
        </div>

        {/* 詳細情報 */}
        <Card>
          <CardHeader>
            <CardTitle>契約情報</CardTitle>
          </CardHeader>
          <dl className="grid grid-cols-2 gap-y-3 text-sm">
            <InfoRow label="初回支払日" value={formatDate(subscription.first_payment_date)} />
            <InfoRow
              label="支払い方法"
              value={subscription.payment_methods?.name ?? "未設定"}
            />
            <InfoRow label="通貨" value={subscription.currency} />
            <InfoRow
              label="月換算"
              value={formatCurrency(subscription.monthly_amount)}
            />
          </dl>
        </Card>

        {/* 支払いログ */}
        <Card padding="none">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <CardTitle>支払い履歴</CardTitle>
            <Button size="sm" onClick={() => setAddLogOpen(true)}>
              <Plus size={15} />
              追加
            </Button>
          </div>

          {logsLoading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-ink-lighter text-sm">
              支払いログがありません
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-5 py-3">
                    <SortableHeader
                      label="支払日"
                      sortKey="payment_date"
                      currentKey={logSortKey}
                      currentOrder={logSortOrder}
                      onSort={handleLogSort}
                    />
                  </th>
                  <th className="text-right px-5 py-3">
                    <SortableHeader
                      label="金額"
                      sortKey="amount"
                      currentKey={logSortKey}
                      currentOrder={logSortOrder}
                      onSort={handleLogSort}
                    />
                  </th>
                  <th className="text-left px-5 py-3 text-xs text-ink-lighter font-semibold">
                    メモ
                  </th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody>
                {sortedLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-5 py-3 text-sm text-ink">
                      {formatDate(log.payment_date)}
                    </td>
                    <td className="px-5 py-3 text-sm font-medium text-ink text-right">
                      {formatCurrency(log.amount)}
                    </td>
                    <td className="px-5 py-3 text-sm text-ink-light">
                      {log.note ?? "-"}
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => removeLog(log.id)}
                        className="text-ink-lighter hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      {/* 編集モーダル */}
      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="サブスクリプションを編集" size="lg">
        <SubscriptionForm
          defaultValues={subscription}
          onSubmit={async (values) => {
            await updateSubscription(id, values);
            setEditOpen(false);
          }}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>

      {/* 削除確認モーダル */}
      <Modal open={deleteConfirm} onClose={() => setDeleteConfirm(false)} title="削除の確認" size="sm">
        <p className="text-sm text-ink-light mb-4">
          「{subscription.service_name}」を削除しますか？支払いログも削除されます。
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(false)}>
            キャンセル
          </Button>
          <Button variant="danger" className="flex-1" onClick={handleDelete}>
            削除する
          </Button>
        </div>
      </Modal>

      {/* 支払いログ追加モーダル */}
      <Modal open={addLogOpen} onClose={() => setAddLogOpen(false)} title="支払いログを追加" size="sm">
        <AddLogForm
          defaultAmount={subscription.amount}
          onSubmit={async (v) => {
            await createLog(v);
            setAddLogOpen(false);
          }}
          onCancel={() => setAddLogOpen(false)}
        />
      </Modal>
    </>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-ink-lighter">{label}</dt>
      <dd className="font-medium text-ink">{value}</dd>
    </>
  );
}

function AddLogForm({
  defaultAmount,
  onSubmit,
  onCancel,
}: {
  defaultAmount: number;
  onSubmit: (v: { payment_date: string; amount: number; note: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState(defaultAmount);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit({ payment_date: date, amount, note });
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-ink">支払日 <span className="text-red-500">*</span></label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          required
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-ink">金額 <span className="text-red-500">*</span></label>
        <input
          type="number"
          min="0"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          required
        />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-ink">メモ</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>
      <div className="flex gap-3">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          キャンセル
        </Button>
        <Button type="submit" className="flex-1" disabled={loading}>
          {loading ? "追加中..." : "追加する"}
        </Button>
      </div>
    </form>
  );
}
