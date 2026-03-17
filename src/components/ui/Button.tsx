import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-1.5 font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
          {
            "bg-primary-500 text-white hover:bg-primary-600 active:bg-primary-700":
              variant === "primary",
            "bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700":
              variant === "secondary",
            "border border-zinc-300 text-zinc-700 bg-white hover:bg-zinc-50 active:bg-zinc-100":
              variant === "outline",
            "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100":
              variant === "ghost",
            "bg-red-500 text-white hover:bg-red-600 active:bg-red-700":
              variant === "danger",
          },
          {
            "text-xs px-3 py-1.5": size === "sm",
            "text-sm px-4 py-2":   size === "md",
            "text-base px-5 py-3": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
