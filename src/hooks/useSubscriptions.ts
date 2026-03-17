"use client";

import { createClient } from "@/lib/supabase/client";
import { withCalc } from "@/lib/calculations";
import type {
  Subscription,
  SubscriptionFormValues,
  SubscriptionWithCalc,
} from "@/types";
import { useCallback, useEffect, useState } from "react";

export function useSubscriptions() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithCalc[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from("subscriptions")
      .select(
        `*, payment_methods(id, name), categories(id, name, color)`
      )
      .order("created_at", { ascending: false });

    if (err) {
      setError(err.message);
    } else {
      // 各サブスクの累計支払額を取得
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
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  const createSubscription = async (values: SubscriptionFormValues) => {
    const { error: err } = await supabase.from("subscriptions").insert({
      service_name: values.service_name,
      billing_cycle: values.billing_cycle,
      amount: values.amount,
      currency: values.currency || "JPY",
      first_payment_date: values.first_payment_date,
      memo: values.memo || null,
      payment_method_id: values.payment_method_id || null,
      category_id: values.category_id || null,
      status: values.status,
    });
    if (err) throw new Error(err.message);
    await fetchSubscriptions();
  };

  const updateSubscription = async (
    id: string,
    values: Partial<SubscriptionFormValues>
  ) => {
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
  const supabase = createClient();

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
