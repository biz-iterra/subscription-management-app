"use client";

import { createClient } from "@/lib/supabase/client";
import type { PaymentLog } from "@/types";
import { useCallback, useEffect, useState } from "react";

export function usePaymentLogs(subscriptionId: string) {
  const [logs, setLogs] = useState<PaymentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from("payment_logs")
      .select("*")
      .eq("subscription_id", subscriptionId)
      .order("payment_date", { ascending: false });
    setLogs(data ?? []);
    setLoading(false);
  }, [subscriptionId, supabase]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (values: { payment_date: string; amount: number; note?: string }) => {
    const { error } = await supabase.from("payment_logs").insert({
      subscription_id: subscriptionId,
      payment_date: values.payment_date,
      amount: values.amount,
      note: values.note ?? null,
    });
    if (error) throw new Error(error.message);
    await fetch();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("payment_logs").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await fetch();
  };

  return { logs, loading, create, remove, refetch: fetch };
}
