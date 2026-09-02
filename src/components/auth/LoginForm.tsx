"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react";
import { loginAction } from "@/lib/auth/actions";
import { INITIAL_LOGIN_STATE } from "@/lib/auth/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const LoginForm = ({
  nextPath,
  notice,
}: {
  nextPath: string;
  notice?: string;
}) => {
  const [state, formAction, pending] = useActionState(
    loginAction,
    INITIAL_LOGIN_STATE,
  );
  const [showPassword, setShowPassword] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (state.attempt === 0) return;
    if (state.fields?.email) {
      emailRef.current?.focus();
      return;
    }
    passwordRef.current?.focus();
  }, [state.attempt, state.fields?.email]);

  return (
    <form action={formAction} noValidate className="space-y-5">
      <input type="hidden" name="next" value={nextPath} />

      {(state.error || notice) && (
        <div
          role={state.error ? "alert" : "status"}
          className="flex gap-3 rounded-xl border border-destructive/25 bg-destructive/6 p-3.5 text-sm leading-6 text-foreground"
        >
          <AlertCircle
            className="mt-0.5 size-4 shrink-0 text-destructive"
            aria-hidden="true"
          />
          <span>{state.error ?? notice}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email address</Label>
        <Input
          key={`email-${state.attempt}`}
          ref={emailRef}
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          defaultValue={state.email}
          className="h-12 bg-card px-3.5"
          aria-invalid={Boolean(state.fields?.email)}
          aria-describedby={state.fields?.email ? "email-error" : undefined}
          disabled={pending}
          required
          autoFocus
        />
        <p
          id="email-error"
          className="min-h-5 text-xs leading-5 text-destructive"
        >
          {state.fields?.email}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            key={`password-${state.attempt}`}
            ref={passwordRef}
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className="h-12 bg-card px-3.5 pr-12"
            aria-invalid={Boolean(state.fields?.password)}
            aria-describedby={
              state.fields?.password ? "password-error" : undefined
            }
            disabled={pending}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            disabled={pending}
            className="absolute top-1/2 right-1.5 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
        <p
          id="password-error"
          className="min-h-5 text-xs leading-5 text-destructive"
        >
          {state.fields?.password}
        </p>
      </div>

      <Button
        type="submit"
        className="h-12 w-full justify-between px-4 shadow-[0_8px_20px_rgba(49,88,216,0.16)]"
        disabled={pending}
        aria-busy={pending}
      >
        <span className="flex items-center gap-2">
          {pending && (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          )}
          <span className="min-w-16 text-left">
            {pending ? "Signing in" : "Sign in"}
          </span>
        </span>
        {!pending && <ArrowRight className="size-4" aria-hidden="true" />}
      </Button>
    </form>
  );
};
