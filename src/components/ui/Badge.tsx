import { cn } from "@/lib/utils";
import type { SubscriptionStatus } from "@/types";

const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active:    "利用中",
  paused:    "停止中",
  cancelled: "解約済",
};

// ライトテーマ — すべて WCAG AA 準拠
const STATUS_STYLES: Record<SubscriptionStatus, string> = {
  active:    "bg-emerald-50 text-emerald-700 border border-emerald-200",
  paused:    "bg-amber-50 text-amber-700 border border-amber-200",
  cancelled: "bg-zinc-100 text-zinc-500 border border-zinc-200",
};

interface StatusBadgeProps { status: SubscriptionStatus; className?: string; }

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium", STATUS_STYLES[status], className)}>
      {status === "active" && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 status-dot-active flex-shrink-0" aria-hidden="true" />
      )}
      {STATUS_LABELS[status]}
    </span>
  );
}

interface BadgeProps { children: React.ReactNode; color?: string; className?: string; }

export function Badge({ children, color, className }: BadgeProps) {
  return (
    <span
      className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium", !color && "bg-zinc-100 text-zinc-600 border border-zinc-200", className)}
      style={color ? { backgroundColor: `${color}18`, color: color, border: `1px solid ${color}30` } : undefined}
    >
      {children}
    </span>
  );
}
