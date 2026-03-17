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

export function SortableHeader({ label, sortKey, currentKey, currentOrder, onSort, className }: SortableHeaderProps) {
  const isActive = currentKey === sortKey;
  return (
    <button
      onClick={() => onSort(sortKey)}
      className={cn(
        "flex items-center gap-1 text-xs font-semibold uppercase tracking-wide transition-colors",
        isActive ? "text-primary-600" : "text-zinc-400 hover:text-zinc-600",
        className
      )}
    >
      {label}
      {isActive
        ? currentOrder === "asc" ? <ChevronUp size={13} /> : <ChevronDown size={13} />
        : <ChevronsUpDown size={13} className="opacity-50" />
      }
    </button>
  );
}
