"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";
import { loginAction } from "@/lib/auth/actions";
import { INITIAL_LOGIN_STATE } from "@/lib/auth/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const LoginForm = ({
  nextPath,
  notice,
  showDemoCredentials,
}: {
  nextPath: string;
  notice?: string;
  showDemoCredentials: boolean;
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
          className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/8 p-3.5 text-sm leading-6 text-foreground"
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
        <div className="flex items-center justify-between gap-4">
          <Label htmlFor="password">Password</Label>
          <span className="text-xs text-muted-foreground">8–72 bytes</span>
        </div>
        <div className="relative">
          <Input
            key={`password-${state.attempt}`}
            ref={passwordRef}
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            className="pr-11"
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
            className="absolute top-1/2 right-1 flex size-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
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
        className="h-11 w-full"
        disabled={pending}
        aria-busy={pending}
      >
        {pending && (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        )}
        <span className="min-w-16">{pending ? "Signing in" : "Sign in"}</span>
      </Button>

      {showDemoCredentials && (
        <div className="rounded-lg bg-muted/60 px-3.5 py-3 font-mono text-xs leading-5 text-muted-foreground">
          <p className="font-sans font-semibold text-foreground">
            Local demo account
          </p>
          <p>test@example.com</p>
          <p>password123</p>
        </div>
      )}
    </form>
  );
};
