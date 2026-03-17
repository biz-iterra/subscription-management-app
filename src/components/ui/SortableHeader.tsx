import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import type { SortOrder } from "@/types";

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentKey: string;
  currentOrder: SortOrder;
  onSort: (key: string) => void;
  className?: string;
}

export function SortableHeader({
  label,
  sortKey,
  currentKey,
  currentOrder,
  onSort,
  className,
}: SortableHeaderProps) {
  const isActive = currentKey === sortKey;

  return (
    <button
      onClick={() => onSort(sortKey)}
      className={cn(
        "flex items-center gap-1 text-xs font-semibold text-ink-light hover:text-ink transition-colors",
        isActive && "text-primary",
        className
      )}
    >
      {label}
      {isActive ? (
        currentOrder === "asc" ? (
          <ChevronUp size={14} />
        ) : (
          <ChevronDown size={14} />
        )
      ) : (
        <ChevronsUpDown size={14} className="opacity-40" />
      )}
    </button>
  );
}
