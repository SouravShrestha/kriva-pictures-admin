import type { InputHTMLAttributes, LabelHTMLAttributes, TextareaHTMLAttributes } from "react";

const fieldClass =
  "w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text placeholder-text-subtle focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-colors";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={`${fieldClass} ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`${fieldClass} ${className}`} {...props} />;
}

export function Field({
  label,
  children,
  className = "",
  ...props
}: LabelHTMLAttributes<HTMLLabelElement> & { label: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className}`} {...props}>
      <span className="text-xs text-text-muted mb-1 block">{label}</span>
      {children}
    </label>
  );
}
