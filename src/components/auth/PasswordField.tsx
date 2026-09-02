"use client";

import { forwardRef, useState, type ChangeEventHandler } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PasswordFieldProps {
  id: string;
  name: string;
  label: string;
  autoComplete: "current-password" | "new-password";
  error?: string;
  describedBy?: string;
  disabled?: boolean;
  value?: string;
  onChange?: ChangeEventHandler<HTMLInputElement>;
}

export const PasswordField = forwardRef<HTMLInputElement, PasswordFieldProps>(
  (
    {
      id,
      name,
      label,
      autoComplete,
      error,
      describedBy,
      disabled,
      value,
      onChange,
    },
    ref,
  ) => {
    const [isVisible, setIsVisible] = useState(false);
    const errorID = `${id}-error`;
    const descriptionIDs = [describedBy, error ? errorID : undefined]
      .filter(Boolean)
      .join(" ");

    return (
      <div className="space-y-2">
        <Label htmlFor={id}>{label}</Label>
        <div className="relative">
          <Input
            ref={ref}
            id={id}
            name={name}
            type={isVisible ? "text" : "password"}
            autoComplete={autoComplete}
            value={value}
            onChange={onChange}
            className="h-12 bg-card px-3.5 pr-12"
            aria-invalid={Boolean(error)}
            aria-describedby={descriptionIDs || undefined}
            disabled={disabled}
            required
          />
          <button
            type="button"
            onClick={() => setIsVisible((visible) => !visible)}
            aria-label={
              isVisible
                ? `Hide ${label.toLowerCase()}`
                : `Show ${label.toLowerCase()}`
            }
            aria-pressed={isVisible}
            disabled={disabled}
            className="absolute top-1/2 right-1.5 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
          >
            {isVisible ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
        <p id={errorID} className="min-h-5 text-xs leading-5 text-destructive">
          {error}
        </p>
      </div>
    );
  },
);

PasswordField.displayName = "PasswordField";
