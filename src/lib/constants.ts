import type { BillingCycle, SubscriptionStatus } from "@/types";

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  weekly: "週次",
  monthly: "月次",
  quarterly: "四半期",
  yearly: "年次",
};

export const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: "利用中",
  paused: "停止中",
  cancelled: "解約済",
};

export const STATUS_COLORS: Record<SubscriptionStatus, string> = {
  active: "bg-secondary-50 text-secondary-700 border-secondary-100",
  paused: "bg-accent-50 text-accent-700 border-accent-100",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
};

export const CURRENCY_SYMBOL: Record<string, string> = {
  JPY: "¥",
  USD: "$",
  EUR: "€",
};

export const DEFAULT_CURRENCY = "JPY";

// カテゴリのデフォルトカラー候補
export const CATEGORY_COLORS = [
  "#4F46E5", // インディゴ
  "#10B981", // エメラルド
  "#F59E0B", // アンバー
  "#EF4444", // レッド
  "#8B5CF6", // パープル
  "#EC4899", // ピンク
  "#06B6D4", // シアン
  "#84CC16", // ライム
  "#F97316", // オレンジ
  "#6B7280", // グレー
];
