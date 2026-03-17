import {
  addDays,
  addMonths,
  addWeeks,
  addYears,
  differenceInDays,
  isBefore,
  parseISO,
} from "date-fns";
import type { BillingCycle, Subscription } from "@/types";

/**
 * 初回支払日と料金サイクルから、今日以降の最初の支払日を計算する
 */
export function calcNextPaymentDate(
  firstPaymentDate: string,
  billingCycle: BillingCycle
): Date {
  const first = parseISO(firstPaymentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let next = first;

  // 初回支払日が未来の場合はそのまま返す
  if (!isBefore(next, today)) {
    return next;
  }

  // 今日以降になるまで1サイクルずつ加算
  while (isBefore(next, today)) {
    next = addOneCycle(next, billingCycle);
  }

  return next;
}

function addOneCycle(date: Date, cycle: BillingCycle): Date {
  switch (cycle) {
    case "weekly":
      return addWeeks(date, 1);
    case "monthly":
      return addMonths(date, 1);
    case "quarterly":
      return addMonths(date, 3);
    case "yearly":
      return addYears(date, 1);
  }
}

/**
 * 次回支払いまでの日数を計算する（今日が支払日の場合は0）
 */
export function calcDaysUntilNextPayment(nextPaymentDate: Date): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return differenceInDays(nextPaymentDate, today);
}

/**
 * 金額を月換算する
 */
export function toMonthlyAmount(amount: number, cycle: BillingCycle): number {
  switch (cycle) {
    case "weekly":
      return (amount * 52) / 12;
    case "monthly":
      return amount;
    case "quarterly":
      return amount / 3;
    case "yearly":
      return amount / 12;
  }
}

/**
 * 金額を年換算する
 */
export function toYearlyAmount(amount: number, cycle: BillingCycle): number {
  switch (cycle) {
    case "weekly":
      return amount * 52;
    case "monthly":
      return amount * 12;
    case "quarterly":
      return amount * 4;
    case "yearly":
      return amount;
  }
}

/**
 * サブスクリプションの計算値を生成する（payment_logs がない場合の推定累計額）
 */
export function estimateTotalPaid(
  firstPaymentDate: string,
  amount: number,
  billingCycle: BillingCycle
): number {
  const first = parseISO(firstPaymentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isBefore(today, first)) return 0;

  let count = 0;
  let current = first;
  while (!isBefore(today, current)) {
    count++;
    current = addOneCycle(current, billingCycle);
  }

  return count * amount;
}

/**
 * next_payment_date が今日から N 日以内かどうか
 */
export function isPaymentSoon(
  nextPaymentDate: Date,
  daysBefore: number
): boolean {
  const days = calcDaysUntilNextPayment(nextPaymentDate);
  return days >= 0 && days <= daysBefore;
}

/**
 * サブスクリプションリストにカルク値を付加して返す
 */
export function withCalc(
  subscription: Subscription,
  totalPaid: number = 0
) {
  const nextDate = calcNextPaymentDate(
    subscription.first_payment_date,
    subscription.billing_cycle
  );
  const daysUntil = calcDaysUntilNextPayment(nextDate);
  const monthly = toMonthlyAmount(subscription.amount, subscription.billing_cycle);
  const yearly = toYearlyAmount(subscription.amount, subscription.billing_cycle);

  return {
    ...subscription,
    next_payment_date: nextDate.toISOString().split("T")[0],
    days_until_next_payment: daysUntil,
    total_paid_amount: totalPaid,
    monthly_amount: monthly,
    yearly_amount: yearly,
  };
}
