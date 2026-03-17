"use client";

import { createClient } from "@/lib/supabase/client";
import type {
  Category,
  CategoryFormValues,
  PaymentMethod,
  PaymentMethodFormValues,
  ReminderSettings,
  ReminderSettingsFormValues,
} from "@/types";
import { useCallback, useEffect, useState } from "react";

export function usePaymentMethods() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from("payment_methods")
      .select("*")
      .order("created_at", { ascending: true });
    setPaymentMethods(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (values: PaymentMethodFormValues) => {
    const { error } = await supabase.from("payment_methods").insert({ name: values.name });
    if (error) throw new Error(error.message);
    await fetch();
  };

  const update = async (id: string, values: PaymentMethodFormValues) => {
    const { error } = await supabase.from("payment_methods").update({ name: values.name }).eq("id", id);
    if (error) throw new Error(error.message);
    await fetch();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("payment_methods").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await fetch();
  };

  return { paymentMethods, loading, create, update, remove, refetch: fetch };
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: true });
    setCategories(data ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetch(); }, [fetch]);

  const create = async (values: CategoryFormValues) => {
    const { error } = await supabase.from("categories").insert({ name: values.name, color: values.color });
    if (error) throw new Error(error.message);
    await fetch();
  };

  const update = async (id: string, values: CategoryFormValues) => {
    const { error } = await supabase.from("categories").update({ name: values.name, color: values.color }).eq("id", id);
    if (error) throw new Error(error.message);
    await fetch();
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw new Error(error.message);
    await fetch();
  };

  return { categories, loading, create, update, remove, refetch: fetch };
}

export function useReminderSettings() {
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from("reminder_settings")
      .select("*")
      .single();
    setSettings(data);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { fetch(); }, [fetch]);

  const update = async (values: ReminderSettingsFormValues) => {
    const { error } = await supabase
      .from("reminder_settings")
      .update({ days_before: values.days_before, email_enabled: values.email_enabled })
      .eq("user_id", settings?.user_id ?? "");
    if (error) throw new Error(error.message);
    await fetch();
  };

  return { settings, loading, update };
}
