"use client";

import { useActionState, useEffect, useRef } from "react";
import { AlertCircle, ArrowRight, CircleCheck, Loader2 } from "lucide-react";
import { loginAction } from "@/lib/auth/actions";
import { INITIAL_LOGIN_STATE } from "@/lib/auth/validation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/auth/PasswordField";

export const LoginForm = ({
  nextPath,
  notice,
  noticeTone = "error",
}: {
  nextPath: string;
  notice?: string;
  noticeTone?: "error" | "success";
}) => {
  const [state, formAction, pending] = useActionState(
    loginAction,
    INITIAL_LOGIN_STATE,
  );
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
          role={state.error || noticeTone === "error" ? "alert" : "status"}
          className={`flex gap-3 rounded-xl border p-3.5 text-sm leading-6 text-foreground ${
            state.error || noticeTone === "error"
              ? "border-destructive/25 bg-destructive/6"
              : "border-success/25 bg-success/6"
          }`}
        >
          {state.error || noticeTone === "error" ? (
            <AlertCircle
              className="mt-0.5 size-4 shrink-0 text-destructive"
              aria-hidden="true"
            />
          ) : (
            <CircleCheck
              className="mt-0.5 size-4 shrink-0 text-success"
              aria-hidden="true"
            />
          )}
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

      <PasswordField
        key={`password-${state.attempt}`}
        ref={passwordRef}
        id="password"
        name="password"
        label="Password"
        autoComplete="current-password"
        error={state.fields?.password}
        disabled={pending}
      />

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
