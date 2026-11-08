import { useId, type TextareaHTMLAttributes } from "react";
import { Field } from "./Field";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export function Textarea({ label, error, hint, id, className = "", ...props }: TextareaProps) {
  const generatedId = useId();
  const textareaId = id ?? generatedId;

  return (
    <Field label={label} htmlFor={textareaId} error={error} hint={hint}>
      <textarea
        id={textareaId}
        className={`rounded-control border bg-white px-4 py-3 text-sm text-ink placeholder:text-muted
          focus:outline-none focus:ring-2 focus:ring-forest
          ${error ? "border-red" : "border-line"} ${className}`}
        {...props}
      />
    </Field>
  );
}
