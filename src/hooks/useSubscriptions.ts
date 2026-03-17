"use client";

import { createClient } from "@/lib/supabase/client";
import { withCalc } from "@/lib/calculations";
import type {
  Subscription,
  SubscriptionFormValues,
  SubscriptionWithCalc,
} from "@/types";
import { addDays, addMonths, addYears, format, parseISO } from "date-fns";
import { useCallback, useEffect, useRef, useState } from "react";

/** billing_cycle に従い、firstPaymentDate から upTo までの全支払日（YYYY-MM-DD）を返す */
function generatePaymentDates(
  firstPaymentDate: string,
  billingCycle: string,
  upTo: Date
): string[] {
  const dates: string[] = [];
  let current = parseISO(firstPaymentDate);
  const ceiling = new Date(upTo);
  ceiling.setHours(0, 0, 0, 0);

  while (current <= ceiling) {
    dates.push(format(current, "yyyy-MM-dd"));
    switch (billingCycle) {
      case "weekly":    current = addDays(current, 7);    break;
      case "monthly":   current = addMonths(current, 1);  break;
      case "quarterly": current = addMonths(current, 3);  break;
      case "yearly":    current = addYears(current, 1);   break;
      default:          current = addMonths(current, 1);
    }
  }
  return dates;
}

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithCalc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // useRef で毎レンダーの再生成を防ぐ
  const supabase = useRef(createClient()).current;

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("subscriptions")
      .select(`*, payment_methods(id, name), categories(id, name, color)`)
      .order("created_at", { ascending: false });

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    const withCalcData = await Promise.all(
      (data as Subscription[]).map(async (sub) => {
        const { data: logs } = await supabase
          .from("payment_logs")
          .select("amount")
          .eq("subscription_id", sub.id);
        const total = logs?.reduce((sum, l) => sum + Number(l.amount), 0) ?? 0;
        return withCalc(sub, total);
      })
    );
    setSubscriptions(withCalcData);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const createSubscription = async (values: SubscriptionFormValues) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("ログインが必要です");

    const { data: newSub, error: err } = await supabase
      .from("subscriptions")
      .insert({
        user_id: user.id,
        service_name: values.service_name,
        billing_cycle: values.billing_cycle,
        amount: values.amount,
        currency: values.currency || "JPY",
        first_payment_date: values.first_payment_date,
        memo: values.memo || null,
        payment_method_id: values.payment_method_id || null,
        category_id: values.category_id || null,
        status: values.status,
      })
      .select()
      .single();
    if (err) throw new Error(err.message);

    // 初回支払日から今日までの全支払日を payment_logs に自動挿入
    if (newSub) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const paymentDates = generatePaymentDates(
        values.first_payment_date,
        values.billing_cycle,
        today
      );
      if (paymentDates.length > 0) {
        await supabase.from("payment_logs").insert(
          paymentDates.map((date) => ({
            user_id: user.id,
            subscription_id: newSub.id,
            payment_date: date,
            amount: values.amount,
            currency: values.currency || "JPY",
            note: "自動記録",
          }))
        );
      }
    }

    await fetchSubscriptions();
  };

  const updateSubscription = async (
    id: string,
    values: Partial<SubscriptionFormValues>
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("ログインが必要です");

    const { error: err } = await supabase
      .from("subscriptions")
      .update({
        service_name: values.service_name,
        billing_cycle: values.billing_cycle,
        amount: values.amount,
        currency: values.currency,
        first_payment_date: values.first_payment_date,
        memo: values.memo || null,
        payment_method_id: values.payment_method_id || null,
        category_id: values.category_id || null,
        status: values.status,
      })
      .eq("id", id);
    if (err) throw new Error(err.message);

    // 自動記録ログを再生成（初回支払日・サイクル・金額が変わっても常に最新状態に）
    if (values.first_payment_date && values.billing_cycle && values.amount != null) {
      await supabase
        .from("payment_logs")
        .delete()
        .eq("subscription_id", id)
        .eq("note", "自動記録");

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const paymentDates = generatePaymentDates(
        values.first_payment_date,
        values.billing_cycle,
        today
      );
      if (paymentDates.length > 0) {
        await supabase.from("payment_logs").insert(
          paymentDates.map((date) => ({
            user_id: user.id,
            subscription_id: id,
            payment_date: date,
            amount: values.amount,
            currency: values.currency || "JPY",
            note: "自動記録",
          }))
        );
      }
    }

    await fetchSubscriptions();
  };

  const deleteSubscription = async (id: string) => {
    const { error: err } = await supabase
      .from("subscriptions")
      .delete()
      .eq("id", id);
    if (err) throw new Error(err.message);
    await fetchSubscriptions();
  };

  return {
    subscriptions,
    loading,
    error,
    refetch: fetchSubscriptions,
    createSubscription,
    updateSubscription,
    deleteSubscription,
  };
}

export function useSubscription(id: string) {
  const [subscription, setSubscription] = useState<SubscriptionWithCalc | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = useRef(createClient()).current;

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select(`*, payment_methods(id, name), categories(id, name, color)`)
        .eq("id", id)
        .single();
      if (data) {
        const { data: logs } = await supabase
          .from("payment_logs")
          .select("amount")
          .eq("subscription_id", id);
        const total = logs?.reduce((sum, l) => sum + Number(l.amount), 0) ?? 0;
        setSubscription(withCalc(data as Subscription, total));
      }
      setLoading(false);
    };
    fetch();
  }, [id, supabase]);

  return { subscription, loading };
}
