// ==========================================
// Enum / Union 型
// ==========================================

export type BillingCycle = "weekly" | "monthly" | "quarterly" | "yearly";
export type SubscriptionStatus = "active" | "paused" | "cancelled";

// ==========================================
// DB テーブル型
// ==========================================

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  service_name: string;
  billing_cycle: BillingCycle;
  amount: number;
  currency: string;
  first_payment_date: string; // ISO date string (YYYY-MM-DD)
  memo: string | null;
  payment_method_id: string | null;
  category_id: string | null;
  status: SubscriptionStatus;
  created_at: string;
  updated_at: string;
  // JOIN されるリレーション
  payment_methods?: Pick<PaymentMethod, "id" | "name"> | null;
  categories?: Pick<Category, "id" | "name" | "color"> | null;
}

export interface PaymentLog {
  id: string;
  subscription_id: string;
  user_id: string;
  payment_date: string; // ISO date string (YYYY-MM-DD)
  amount: number;
  currency: string;
  note: string | null;
  created_at: string;
}

export interface ReminderSettings {
  id: string;
  user_id: string;
  days_before: number;
  email_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// ==========================================
// 計算済み拡張型
// ==========================================

export interface SubscriptionWithCalc extends Subscription {
  next_payment_date: string; // 計算された次回支払日 (YYYY-MM-DD)
  days_until_next_payment: number; // 次回支払いまでの日数
  total_paid_amount: number; // 累計支払額
  monthly_amount: number; // 月換算金額（分析用）
  yearly_amount: number; // 年換算金額（分析用）
}

// ==========================================
// フォーム型
// ==========================================

export interface SubscriptionFormValues {
  service_name: string;
  billing_cycle: BillingCycle;
  amount: number;
  currency: string;
  first_payment_date: string;
  memo: string;
  payment_method_id: string;
  category_id: string;
  status: SubscriptionStatus;
}

export interface PaymentMethodFormValues {
  name: string;
}

export interface CategoryFormValues {
  name: string;
  color: string;
}

export interface ReminderSettingsFormValues {
  days_before: number;
  email_enabled: boolean;
}

// ==========================================
// 分析・グラフ用型
// ==========================================

export interface PieChartData {
  name: string;
  value: number;
  color: string;
  percentage: number;
}

export interface MonthlyBarData {
  month: string; // "YYYY-MM"
  label: string; // "1月", "2月" 等
  total: number;
}

// ==========================================
// ソート用型
// ==========================================

export type SortOrder = "asc" | "desc";

export interface SortState<T extends string> {
  key: T;
  order: SortOrder;
}
