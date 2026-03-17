"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { BILLING_CYCLE_LABELS, STATUS_LABELS } from "@/lib/constants";
import { useCategories, usePaymentMethods } from "@/hooks/useSettings";
import type { Subscription, SubscriptionFormValues } from "@/types";
import { zodResolver } from "@hookform/resolvers/zod";
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

interface SubscriptionFormProps {
  defaultValues?: Partial<Subscription>;
  onSubmit: (values: SubscriptionFormValues) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function SubscriptionForm({
  defaultValues,
  onSubmit,
  onCancel,
  submitLabel = "保存",
}: SubscriptionFormProps) {
  const { paymentMethods } = usePaymentMethods();
  const { categories } = useCategories();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SubscriptionFormValues>({
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        id="service_name"
        label="サービス名"
        placeholder="例: Netflix"
        required
        error={errors.service_name?.message}
        {...register("service_name")}
      />

      <div className="grid grid-cols-2 gap-3">
        <Select
          id="billing_cycle"
          label="料金サイクル"
          required
          options={Object.entries(BILLING_CYCLE_LABELS).map(([v, l]) => ({
            value: v,
            label: l,
          }))}
          {...register("billing_cycle")}
        />
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-ink">
            金額 <span className="text-red-500">*</span>
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-3 text-sm text-ink-light border border-r-0 border-gray-200 rounded-l-lg bg-gray-50">
              ¥
            </span>
            <input
              type="number"
              min="0"
              className="flex-1 px-3 py-2 text-sm rounded-r-lg border border-gray-200 bg-white text-ink focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              {...register("amount")}
            />
          </div>
          {errors.amount && (
            <p className="text-xs text-red-500">{errors.amount.message}</p>
          )}
        </div>
      </div>

      <Input
        id="first_payment_date"
        label="初回支払日"
        type="date"
        required
        error={errors.first_payment_date?.message}
        {...register("first_payment_date")}
      />

      <div className="grid grid-cols-2 gap-3">
        <Select
          id="category_id"
          label="カテゴリ"
          options={[
            { value: "", label: "未分類" },
            ...categories.map((c) => ({ value: c.id, label: c.name })),
          ]}
          {...register("category_id")}
        />
        <Select
          id="payment_method_id"
          label="支払い方法"
          options={[
            { value: "", label: "未設定" },
            ...paymentMethods.map((p) => ({ value: p.id, label: p.name })),
          ]}
          {...register("payment_method_id")}
        />
      </div>

      <Select
        id="status"
        label="ステータス"
        required
        options={Object.entries(STATUS_LABELS).map(([v, l]) => ({
          value: v,
          label: l,
        }))}
        {...register("status")}
      />

      <div className="flex flex-col gap-1">
        <label htmlFor="memo" className="text-sm font-medium text-ink">
          メモ
        </label>
        <textarea
          id="memo"
          rows={3}
          className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-ink placeholder:text-ink-lighter focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
          placeholder="任意メモ"
          {...register("memo")}
        />
      </div>

      <div className="flex gap-3 pt-2">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={onCancel}
        >
          キャンセル
        </Button>
        <Button type="submit" className="flex-1" disabled={isSubmitting}>
          {isSubmitting ? "保存中..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
