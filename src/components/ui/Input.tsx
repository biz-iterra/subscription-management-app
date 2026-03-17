import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">
            {label}
            {props.required && <span className="text-red-500 ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "input-dark w-full px-3.5 py-2.5 text-sm rounded-xl",
            error && "!border-red-400 focus:!shadow-[0_0_0_3px_rgba(239,68,68,0.15)]",
            className
          )}
          {...props}
        />
        {hint && !error && <p className="text-xs text-zinc-400">{hint}</p>}
        {error && <p className="text-xs text-red-500" role="alert">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
