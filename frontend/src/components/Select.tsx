import { useId, type SelectHTMLAttributes } from "react";
import { Field } from "./Field";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export function Select({ label, error, hint, id, className = "", children, ...props }: SelectProps) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  return (
    <Field label={label} htmlFor={selectId} error={error} hint={hint}>
      <select
        id={selectId}
        className={`h-12 rounded-control border bg-white px-4 text-sm text-ink
          focus:outline-none focus:ring-2 focus:ring-forest
          ${error ? "border-red" : "border-line"} ${className}`}
        {...props}
      >
        {children}
      </select>
    </Field>
  );
}
