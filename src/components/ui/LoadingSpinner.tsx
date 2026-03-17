import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ className, size = "md" }: LoadingSpinnerProps) {
  return (
    <div className={cn(
      "animate-spin rounded-full border-2 border-white/10 border-t-primary-400",
      { "w-4 h-4": size === "sm", "w-6 h-6": size === "md", "w-8 h-8": size === "lg" },
      className
    )} />
  );
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );
}
