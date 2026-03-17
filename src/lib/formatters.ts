import { format, formatDistanceToNow, parseISO } from "date-fns";
import { ja } from "date-fns/locale";
import { CURRENCY_SYMBOL } from "./constants";

/**
 * 金額を通貨フォーマットで返す（例: ¥1,500）
 */
export function formatCurrency(amount: number, currency = "JPY"): string {
  const symbol = CURRENCY_SYMBOL[currency] ?? currency;
  return `${symbol}${amount.toLocaleString("ja-JP")}`;
}

/**
 * ISO date string を "YYYY年M月D日" 形式に変換
 */
export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), "yyyy年M月d日", { locale: ja });
}

/**
 * ISO date string を "YYYY/MM/DD" 形式に変換
 */
export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), "yyyy/MM/dd");
}

/**
 * ISO date string を "M月" 形式に変換
 */
export function formatMonth(dateStr: string): string {
  return format(parseISO(dateStr + "-01"), "M月", { locale: ja });
}

/**
 * 次回支払いまでの日数を日本語テキストで返す
 */
export function formatDaysUntil(days: number): string {
  if (days === 0) return "今日";
  if (days === 1) return "明日";
  if (days < 0) return `${Math.abs(days)}日超過`;
  return `${days}日後`;
}

/**
 * 開始日から現在までの経過期間を日本語で返す（例: "約1年2ヶ月"）
 */
export function formatElapsed(firstPaymentDate: string): string {
  return formatDistanceToNow(parseISO(firstPaymentDate), {
    locale: ja,
    addSuffix: false,
  });
}

/**
 * "YYYY-MM" 形式を "YYYY年M月" に変換
 */
export function formatYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split("-");
  return `${year}年${parseInt(month)}月`;
}
