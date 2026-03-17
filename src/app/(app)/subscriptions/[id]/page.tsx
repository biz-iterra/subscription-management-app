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
import { formatCurrency, formatDate, formatDaysUntil, formatElapsed } from "@/lib/formatters";
import { BILLING_CYCLE_LABELS } from "@/lib/constants";
import type { SortOrder } from "@/types";
import { ArrowLeft, Edit, Plus, Trash2 } from "lucide-react";
import Link from "next/link";

export default function SubscriptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
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
    if (logSortKey === key) setLogSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    else { setLogSortKey(key as "payment_date" | "amount"); setLogSortOrder("asc"); }
  };

  const sortedLogs = useMemo(() => {
    return [...logs].sort((a, b) => {
      const aVal = a[logSortKey], bVal = b[logSortKey];
      if (aVal < bVal) return logSortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return logSortOrder === "asc" ? 1 : -1;
      return 0;
    });
  }, [logs, logSortKey, logSortOrder]);

  if (loading) return (<><Header title="詳細" /><div className="flex justify-center py-16"><LoadingSpinner /></div></>);
  if (!subscription) return (<><Header title="詳細" /><div className="p-6 text-sm text-zinc-500">見つかりませんでした</div></>);

  const isSoon = subscription.status === "active" && subscription.days_until_next_payment >= 0 && subscription.days_until_next_payment <= 7;

  return (
    <>
      <Header title="詳細" />
      <div className="p-6 space-y-5 max-w-3xl">

        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-sm text-zinc-500 hover:text-zinc-900 transition-colors">
          <ArrowLeft size={15} aria-hidden="true" />一覧へ戻る
        </Link>

        {/* メインカード */}
        <Card>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                {subscription.categories && <Badge color={subscription.categories.color}>{subscription.categories.name}</Badge>}
                <StatusBadge status={subscription.status} />
              </div>
              <h2 className="text-xl font-bold text-zinc-900">{subscription.service_name}</h2>
              {subscription.memo && <p className="text-sm text-zinc-500 mt-2 whitespace-pre-line leading-relaxed">{subscription.memo}</p>}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                <Edit size={14} aria-hidden="true" />編集
              </Button>
              <Button size="sm" variant="danger" onClick={() => setDeleteConfirm(true)} aria-label="削除">
                <Trash2 size={14} aria-hidden="true" />
              </Button>
            </div>
          </div>
        </Card>

        {/* 数値サマリー */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: `${BILLING_CYCLE_LABELS[subscription.billing_cycle]}料金`, value: formatCurrency(subscription.amount), accent: true },
            { label: "次回支払日", value: formatDate(subscription.next_payment_date), sub: formatDaysUntil(subscription.days_until_next_payment), subWarn: isSoon },
            { label: "累計支払額", value: formatCurrency(subscription.total_paid_amount) },
            { label: "利用期間", value: formatElapsed(subscription.first_payment_date), sub: `${formatDate(subscription.first_payment_date)}〜` },
          ].map((item) => (
            <div key={item.label} className="bg-white border border-zinc-200 rounded-xl p-4 shadow-card">
              <p className="text-xs text-zinc-400 mb-1 font-medium">{item.label}</p>
              <p className={`text-sm font-bold tabnum ${item.accent ? "text-primary-600" : "text-zinc-900"}`}>{item.value}</p>
              {item.sub && <p className={`text-xs mt-1 ${item.subWarn ? "text-amber-600 font-medium" : "text-zinc-400"}`}>{item.sub}</p>}
            </div>
          ))}
        </div>

        {/* 契約情報 */}
        <Card>
          <CardHeader><CardTitle>契約情報</CardTitle></CardHeader>
          <dl className="grid grid-cols-2 gap-y-3.5 text-sm">
            {[
              ["初回支払日",  formatDate(subscription.first_payment_date)],
              ["支払い方法",  subscription.payment_methods?.name ?? "未設定"],
              ["通貨",        subscription.currency],
              ["月換算",      formatCurrency(subscription.monthly_amount)],
            ].map(([label, value]) => (
              <div key={label} className="contents">
                <dt className="text-zinc-400">{label}</dt>
                <dd className="font-medium text-zinc-900 tabnum">{value}</dd>
              </div>
            ))}
          </dl>
        </Card>

        {/* 支払いログ */}
        <Card padding="none">
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
            <CardTitle>支払い履歴</CardTitle>
            <Button size="sm" onClick={() => setAddLogOpen(true)}>
              <Plus size={14} aria-hidden="true" />追加
            </Button>
          </div>
          {logsLoading ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-zinc-400 text-sm">支払いログがありません</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50/60">
                  <th className="text-left px-5 py-3"><SortableHeader label="支払日" sortKey="payment_date" currentKey={logSortKey} currentOrder={logSortOrder} onSort={handleLogSort} /></th>
                  <th className="text-right px-5 py-3"><SortableHeader label="金額" sortKey="amount" currentKey={logSortKey} currentOrder={logSortOrder} onSort={handleLogSort} /></th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-zinc-400 uppercase tracking-wide">メモ</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {sortedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-zinc-700">{formatDate(log.payment_date)}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-zinc-900 text-right tabnum">{formatCurrency(log.amount)}</td>
                    <td className="px-5 py-3.5 text-sm text-zinc-400">{log.note ?? "—"}</td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => removeLog(log.id)} aria-label="削除" className="text-zinc-300 hover:text-red-500 transition-colors">
                        <Trash2 size={14} aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="サブスクリプションを編集" size="lg">
        <SubscriptionForm defaultValues={subscription} onSubmit={async (v) => { await updateSubscription(id, v); setEditOpen(false); }} onCancel={() => setEditOpen(false)} />
      </Modal>

      <Modal open={deleteConfirm} onClose={() => setDeleteConfirm(false)} title="削除の確認" size="sm">
        <p className="text-sm text-zinc-600 mb-5">「{subscription.service_name}」を削除しますか？支払いログも削除されます。</p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(false)}>キャンセル</Button>
          <Button variant="danger" className="flex-1" onClick={async () => { await deleteSubscription(id); router.push("/dashboard"); }}>削除する</Button>
        </div>
      </Modal>

      <Modal open={addLogOpen} onClose={() => setAddLogOpen(false)} title="支払いログを追加" size="sm">
        <AddLogForm defaultAmount={subscription.amount} onSubmit={async (v) => { await createLog(v); setAddLogOpen(false); }} onCancel={() => setAddLogOpen(false)} />
      </Modal>
    </>
  );
}

const fieldClass = "input-dark w-full px-3.5 py-2.5 text-sm rounded-xl";
const labelClass = "text-xs font-semibold text-zinc-500 uppercase tracking-widest";

function AddLogForm({ defaultAmount, onSubmit, onCancel }: {
  defaultAmount: number;
  onSubmit: (v: { payment_date: string; amount: number; note: string }) => Promise<void>;
  onCancel: () => void;
}) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState(defaultAmount);
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit({ payment_date: date, amount, note });
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>支払日 <span className="text-red-500">*</span></label>
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={fieldClass} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>金額 <span className="text-red-500">*</span></label>
        <input type="number" min="0" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className={`${fieldClass} tabnum`} required />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className={labelClass}>メモ</label>
        <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className={fieldClass} placeholder="任意メモ" />
      </div>
      <div className="flex gap-3 pt-1">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>キャンセル</Button>
        <Button type="submit" className="flex-1" disabled={submitting}>{submitting ? "追加中..." : "追加する"}</Button>
      </div>
    </form>
  );
}
