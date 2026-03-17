"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { BILLING_CYCLE_LABELS, CATEGORY_COLORS, STATUS_LABELS } from "@/lib/constants";
import { useCategories, usePaymentMethods } from "@/hooks/useSettings";
import type { Subscription, SubscriptionFormValues } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const schema = z.object({
  service_name: z.string().min(1, "サービス名を入力してください"),
  billing_cycle: z.enum(["weekly", "monthly", "quarterly", "yearly"]),
  amount: z.coerce.number().min(0, "0以上の金額を入力してください"),
  currency: z.string().default("JPY"),
  first_payment_date: z.string().min(1, "初回支払日を入力してください"),
  memo: z.string().default(""),
  payment_method_id: z.string().default(""),
  category_id: z.string().default(""),
  status: z.enum(["active", "paused", "cancelled"]),
});

const selectClass = "input-dark w-full pl-3.5 pr-9 py-2.5 text-sm rounded-xl appearance-none";
const labelClass = "text-sm font-medium text-zinc-700";

interface SubscriptionFormProps {
  defaultValues?: Partial<Subscription>;
  onSubmit: (values: SubscriptionFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function SubscriptionForm({ defaultValues, onSubmit, onCancel, submitLabel = "保存" }: SubscriptionFormProps) {
  const { paymentMethods } = usePaymentMethods();
  const { categories, create: createCategory } = useCategories();

  const [addCategoryOpen, setAddCategoryOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(CATEGORY_COLORS[0]);
  const [savingCategory, setSavingCategory] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<SubscriptionFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      service_name: defaultValues?.service_name ?? "",
      billing_cycle: defaultValues?.billing_cycle ?? "monthly",
      amount: defaultValues?.amount ?? 0,
      currency: defaultValues?.currency ?? "JPY",
      first_payment_date: defaultValues?.first_payment_date ?? "",
      memo: defaultValues?.memo ?? "",
      payment_method_id: defaultValues?.payment_method_id ?? "",
      category_id: defaultValues?.category_id ?? "",
      status: defaultValues?.status ?? "active",
    },
  });

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setSavingCategory(true);
    try {
      await createCategory({ name: newCategoryName.trim(), color: newCategoryColor });
      const created = categories.find((c) => c.name === newCategoryName.trim());
      if (created) setValue("category_id", created.id);
      setNewCategoryName("");
      setNewCategoryColor(CATEGORY_COLORS[0]);
      setAddCategoryOpen(false);
    } catch (e) { console.error(e); }
    setSavingCategory(false);
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input id="service_name" label="サービス名" placeholder="例: Netflix" required
          error={errors.service_name?.message} {...register("service_name")} />

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>料金サイクル <span className="text-red-400">*</span></label>
            <div className="relative">
              <select className={selectClass} {...register("billing_cycle")}>
                {Object.entries(BILLING_CYCLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>金額 <span className="text-red-400">*</span></label>
            <div className="flex rounded-xl overflow-hidden border border-zinc-200 focus-within:border-primary-500 focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.12)] transition-all">
              <span className="inline-flex items-center px-3 text-sm font-medium text-zinc-500 bg-zinc-50 border-r border-zinc-200 select-none">¥</span>
              <input type="number" min="0"
                className="flex-1 px-3 py-2.5 text-sm bg-white text-zinc-900 focus:outline-none"
                {...register("amount")} />
            </div>
            {errors.amount && <p className="text-xs text-red-500 mt-0.5">{errors.amount.message}</p>}
          </div>
        </div>

        <Input id="first_payment_date" label="初回支払日" type="date" required
          error={errors.first_payment_date?.message} {...register("first_payment_date")} />

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>カテゴリ</label>
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <select className={selectClass + " w-full"} {...register("category_id")}>
                  <option value="">未分類</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              </div>
              <button type="button" onClick={() => setAddCategoryOpen(true)}
                className="flex-shrink-0 w-10 flex items-center justify-center rounded-xl border border-zinc-200 text-zinc-400 hover:text-primary-500 hover:border-primary-300 hover:bg-primary-50 transition-colors bg-white">
                <Plus size={15} />
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className={labelClass}>支払い方法</label>
            <div className="relative">
              <select className={selectClass} {...register("payment_method_id")}>
                <option value="">未設定</option>
                {paymentMethods.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className={labelClass}>ステータス <span className="text-red-400">*</span></label>
          <div className="relative">
            <select className={selectClass} {...register("status")}>
              {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="memo" className={labelClass}>メモ</label>
          <textarea id="memo" rows={3}
            className="input-dark w-full px-3.5 py-2.5 text-sm rounded-xl resize-none"
            placeholder="任意メモ" {...register("memo")} />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>キャンセル</Button>
          <Button type="submit" className="flex-1" disabled={isSubmitting}>
            {isSubmitting ? "保存中..." : submitLabel}
          </Button>
        </div>
      </form>

      <Modal open={addCategoryOpen} onClose={() => setAddCategoryOpen(false)} title="カテゴリを追加" size="sm">
        <div className="space-y-4">
          <Input label="カテゴリ名" placeholder="例: 動画配信"
            value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} required />
          <div className="flex flex-col gap-2">
            <label className={labelClass}>カラー</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setNewCategoryColor(c)}
                  className="w-7 h-7 rounded-full border-2 transition-all"
                  style={{ backgroundColor: c, borderColor: newCategoryColor === c ? "white" : "transparent",
                    transform: newCategoryColor === c ? "scale(1.25)" : "scale(1)" }} />
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setAddCategoryOpen(false)}>キャンセル</Button>
            <Button className="flex-1" onClick={handleAddCategory} disabled={savingCategory || !newCategoryName.trim()}>追加</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
