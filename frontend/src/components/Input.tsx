import { useId, type InputHTMLAttributes } from "react";
import { Field } from "./Field";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export function Input({ label, error, hint, id, className = "", ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <Field label={label} htmlFor={inputId} error={error} hint={hint}>
      <input
        id={inputId}
        className={`h-12 rounded-control border bg-white px-4 text-sm text-ink placeholder:text-muted
          focus:outline-none focus:ring-2 focus:ring-forest
          ${error ? "border-red" : "border-line"} ${className}`}
        {...props}
      />
    </Field>
  );
}
