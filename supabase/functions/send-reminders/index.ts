import { createClient } from "jsr:@supabase/supabase-js@2";

interface Subscription {
  id: string;
  user_id: string;
  service_name: string;
  billing_cycle: "weekly" | "monthly" | "quarterly" | "yearly";
  amount: number;
  currency: string;
  first_payment_date: string;
  status: string;
}

interface ReminderSettings {
  user_id: string;
  days_before: number;
  email_enabled: boolean;
  profiles: { email: string; display_name: string | null };
}

// ==========================================
// 次回支払日の計算
// ==========================================
function calcNextPaymentDate(
  firstPaymentDate: string,
  billingCycle: Subscription["billing_cycle"]
): Date {
  const first = new Date(firstPaymentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let next = new Date(first);
  if (next >= today) return next;

  while (next < today) {
    switch (billingCycle) {
      case "weekly":
        next.setDate(next.getDate() + 7);
        break;
      case "monthly":
        next.setMonth(next.getMonth() + 1);
        break;
      case "quarterly":
        next.setMonth(next.getMonth() + 3);
        break;
      case "yearly":
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
  }
  return next;
}

function diffInDays(target: Date, base: Date): number {
  const t = new Date(target);
  const b = new Date(base);
  t.setHours(0, 0, 0, 0);
  b.setHours(0, 0, 0, 0);
  return Math.round((t.getTime() - b.getTime()) / (1000 * 60 * 60 * 24));
}

function formatCurrency(amount: number, currency: string): string {
  const symbol = currency === "JPY" ? "¥" : currency;
  return `${symbol}${amount.toLocaleString("ja-JP")}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ==========================================
// メール HTML テンプレート
// ==========================================
function buildEmailHtml(
  displayName: string | null,
  subscriptions: Array<{ name: string; amount: number; currency: string; nextDate: Date; daysUntil: number }>,
  daysBefore: number
): string {
  const subsList = subscriptions
    .map(
      (s) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;font-size:14px;color:#1E293B;">${s.name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;font-size:14px;color:#1E293B;text-align:right;">${formatCurrency(s.amount, s.currency)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #F1F5F9;font-size:14px;color:#475569;">${formatDate(s.nextDate)}</td>
      </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAFC;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:520px;margin:40px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:#4F46E5;padding:28px 32px;">
      <h1 style="margin:0;font-size:20px;color:white;">サブスク管理</h1>
      <p style="margin:6px 0 0;font-size:14px;color:rgba(255,255,255,0.8);">支払いリマインド</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="margin:0 0 16px;font-size:15px;color:#1E293B;">
        ${displayName ? `${displayName} さん、` : ""}こんにちは。<br>
        <strong>${daysBefore}日後</strong>に以下のサブスクリプションの支払いが発生します。
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <thead>
          <tr style="background:#F8FAFC;">
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#94A3B8;font-weight:600;">サービス名</th>
            <th style="padding:10px 12px;text-align:right;font-size:12px;color:#94A3B8;font-weight:600;">金額</th>
            <th style="padding:10px 12px;text-align:left;font-size:12px;color:#94A3B8;font-weight:600;">支払日</th>
          </tr>
        </thead>
        <tbody>${subsList}</tbody>
      </table>
      <a href="${Deno.env.get("NEXT_PUBLIC_APP_URL") ?? "#"}/dashboard"
         style="display:inline-block;background:#4F46E5;color:white;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;">
        サブスク管理を開く
      </a>
    </div>
    <div style="padding:16px 32px;background:#F8FAFC;border-top:1px solid #E2E8F0;">
      <p style="margin:0;font-size:12px;color:#94A3B8;">
        このメールはサブスク管理アプリから自動送信されています。<br>
        通知を停止するには、アプリの設定からリマインドを無効にしてください。
      </p>
    </div>
  </div>
</body>
</html>`;
}

// ==========================================
// メインハンドラ
// ==========================================
Deno.serve(async (_req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // RLS バイパス
    );

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. メール通知が有効なユーザーのリマインド設定を取得
    const { data: reminderSettings, error: rsError } = await supabase
      .from("reminder_settings")
      .select("*, profiles(email, display_name)")
      .eq("email_enabled", true);

    if (rsError) throw rsError;

    let emailsSent = 0;
    let logsInserted = 0;

    for (const setting of (reminderSettings as ReminderSettings[]) ?? []) {
      // 2. そのユーザーのアクティブなサブスクリプションを取得
      const { data: subs } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", setting.user_id)
        .eq("status", "active");

      const targets = [];

      for (const sub of (subs as Subscription[]) ?? []) {
        const nextDate = calcNextPaymentDate(
          sub.first_payment_date,
          sub.billing_cycle
        );
        const diff = diffInDays(nextDate, today);

        // リマインド対象（N日前）
        if (diff === setting.days_before) {
          targets.push({
            name: sub.service_name,
            amount: sub.amount,
            currency: sub.currency,
            nextDate,
            daysUntil: diff,
          });
        }

        // 今日が支払日の場合、payment_logs に挿入（重複防止）
        if (diff === 0) {
          const { data: existing } = await supabase
            .from("payment_logs")
            .select("id")
            .eq("subscription_id", sub.id)
            .eq("payment_date", today.toISOString().split("T")[0])
            .maybeSingle();

          if (!existing) {
            await supabase.from("payment_logs").insert({
              subscription_id: sub.id,
              user_id: setting.user_id,
              payment_date: today.toISOString().split("T")[0],
              amount: sub.amount,
              currency: sub.currency,
            });
            logsInserted++;
          }
        }
      }

      // 3. リマインド対象があればメール送信
      if (targets.length > 0) {
        const resendApiKey = Deno.env.get("RESEND_API_KEY");
        const fromEmail =
          Deno.env.get("RESEND_FROM_EMAIL") ?? "noreply@example.com";

        if (resendApiKey) {
          const response = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: fromEmail,
              to: setting.profiles.email,
              subject: `【サブスク管理】${setting.days_before}日後に${targets.length}件の支払いがあります`,
              html: buildEmailHtml(
                setting.profiles.display_name,
                targets,
                setting.days_before
              ),
            }),
          });

          if (response.ok) emailsSent++;
        }
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        emailsSent,
        logsInserted,
        processedAt: new Date().toISOString(),
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-reminders error:", error);
    return new Response(
      JSON.stringify({ ok: false, error: String(error) }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
