import type { ButtonHTMLAttributes } from "react";

export type ButtonVariant = "primary" | "secondary" | "danger" | "support";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-forest text-white hover:bg-[#1f4d42] disabled:bg-disabled disabled:text-muted",
  secondary: "bg-white text-ink border border-line hover:bg-paper disabled:text-muted disabled:bg-disabled",
  danger: "bg-red text-white hover:bg-[#8f3636] disabled:bg-disabled disabled:text-muted",
  support: "bg-sage text-ink hover:bg-[#dbe4d8] disabled:bg-disabled disabled:text-muted",
};

export function buttonClasses(variant: ButtonVariant = "primary", className = ""): string {
  return `inline-flex h-12 items-center justify-center rounded-control px-5 text-sm font-medium
    transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
    focus-visible:outline-forest disabled:cursor-not-allowed ${variantClasses[variant]} ${className}`;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export function Button({ variant = "primary", className = "", disabled, ...props }: ButtonProps) {
  return <button disabled={disabled} className={buttonClasses(variant, className)} {...props} />;
}
