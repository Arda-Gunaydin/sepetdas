import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export const inputClasses =
  "block w-full min-h-12 rounded-xl border border-input bg-surface px-3 py-2 text-base text-foreground " +
  "placeholder:text-muted-foreground/80 transition-colors duration-150 " +
  "focus-visible:border-primary aria-[invalid=true]:border-destructive disabled:opacity-60";

type FieldProps = {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: string;
  optional?: boolean;
  children: ReactNode;
};

/** Görünür etiket + yardım metni + alanın hemen altında hata. */
export function Field({ id, label, hint, error, optional, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-semibold text-foreground">
        {label}
        {optional ? <span className="font-normal text-muted-foreground"> (isteğe bağlı)</span> : null}
      </label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-sm text-muted-foreground">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function describedBy(id: string, error?: string, hint?: boolean) {
  if (error) return `${id}-error`;
  if (hint) return `${id}-hint`;
  return undefined;
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & { id: string; error?: string; hasHint?: boolean };

export function Input({ id, error, hasHint, className = "", ...props }: InputProps) {
  return (
    <input
      id={id}
      name={props.name ?? id}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(id, error, hasHint)}
      className={`${inputClasses} ${className}`}
      {...props}
    />
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & { id: string; error?: string; hasHint?: boolean };

export function Select({ id, error, hasHint, className = "", children, ...props }: SelectProps) {
  return (
    <select
      id={id}
      name={props.name ?? id}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(id, error, hasHint)}
      className={`${inputClasses} cursor-pointer ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & { id: string; error?: string; hasHint?: boolean };

export function Textarea({ id, error, hasHint, className = "", ...props }: TextareaProps) {
  return (
    <textarea
      id={id}
      name={props.name ?? id}
      aria-invalid={error ? true : undefined}
      aria-describedby={describedBy(id, error, hasHint)}
      className={`${inputClasses} min-h-24 ${className}`}
      {...props}
    />
  );
}
