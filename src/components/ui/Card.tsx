import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "none" | "sm" | "md" | "lg";
  variant?: "default" | "elevated" | "primary";
}

export function Card({ className, padding = "md", variant = "default", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white border border-zinc-200 rounded-2xl shadow-card",
        {
          "p-0": padding === "none",
          "p-4": padding === "sm",
          "p-5": padding === "md",
          "p-6": padding === "lg",
        },
        variant === "elevated" && "shadow-card-md",
        variant === "primary" && "bg-primary-50 border-primary-200",
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex items-center justify-between mb-4", className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("text-sm font-semibold text-zinc-900", className)} {...props} />;
}
