"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowRight, Check, Circle, Loader2 } from "lucide-react";
import { PasswordField } from "@/components/auth/PasswordField";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signupAction } from "@/lib/auth/actions";
import {
  getPasswordRequirements,
  INITIAL_SIGNUP_STATE,
} from "@/lib/auth/validation";

export const SignupForm = ({ nextPath }: { nextPath: string }) => {
  const [state, formAction, pending] = useActionState(
    signupAction,
    INITIAL_SIGNUP_STATE,
  );
  const [passwordDraft, setPasswordDraft] = useState({
    attempt: state.attempt,
    value: "",
  });
  const [confirmationDraft, setConfirmationDraft] = useState({
    attempt: state.attempt,
    value: "",
  });
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmationRef = useRef<HTMLInputElement>(null);
  const password =
    passwordDraft.attempt === state.attempt ? passwordDraft.value : "";
  const confirmation =
    confirmationDraft.attempt === state.attempt ? confirmationDraft.value : "";
  const requirements = getPasswordRequirements(password);

  useEffect(() => {
    if (state.attempt === 0) return;
    if (state.fields?.name) {
      nameRef.current?.focus();
      return;
    }
    if (state.fields?.email) {
      emailRef.current?.focus();
      return;
    }
    if (state.fields?.password) {
      passwordRef.current?.focus();
      return;
    }
    confirmationRef.current?.focus();
  }, [state.attempt, state.fields]);

  return (
    <form action={formAction} noValidate className="space-y-5">
      <input type="hidden" name="next" value={nextPath} />

      {state.error && (
        <div
          role="alert"
          className="flex gap-3 rounded-xl border border-destructive/25 bg-destructive/6 p-3.5 text-sm leading-6 text-foreground"
        >
          <AlertCircle
            className="mt-0.5 size-4 shrink-0 text-destructive"
            aria-hidden="true"
          />
          <span>{state.error}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input
          key={`name-${state.attempt}`}
          ref={nameRef}
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          defaultValue={state.name}
          className="h-12 bg-card px-3.5"
          aria-invalid={Boolean(state.fields?.name)}
          aria-describedby={state.fields?.name ? "name-error" : undefined}
          disabled={pending}
          required
          autoFocus
        />
        <p
          id="name-error"
          className="min-h-5 text-xs leading-5 text-destructive"
        >
          {state.fields?.name}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="signup-email">Email address</Label>
        <Input
          key={`email-${state.attempt}`}
          ref={emailRef}
          id="signup-email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          defaultValue={state.email}
          className="h-12 bg-card px-3.5"
          aria-invalid={Boolean(state.fields?.email)}
          aria-describedby={
            state.fields?.email ? "signup-email-error" : undefined
          }
          disabled={pending}
          required
        />
        <p
          id="signup-email-error"
          className="min-h-5 text-xs leading-5 text-destructive"
        >
          {state.fields?.email}
        </p>
      </div>

      <PasswordField
        key={`new-password-${state.attempt}`}
        ref={passwordRef}
        id="new-password"
        name="password"
        label="Password"
        autoComplete="new-password"
        value={password}
        onChange={(event) =>
          setPasswordDraft({
            attempt: state.attempt,
            value: event.target.value,
          })
        }
        error={state.fields?.password}
        describedBy="password-requirements"
        disabled={pending}
      />

      <ul
        id="password-requirements"
        aria-label="Password requirements"
        className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-xl border bg-card/65 p-3 text-xs text-muted-foreground"
      >
        {requirements.map((requirement) => (
          <li
            key={requirement.id}
            className={`flex items-center gap-2 ${
              requirement.met ? "text-success" : "text-muted-foreground"
            }`}
          >
            {requirement.met ? (
              <Check className="size-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <Circle className="size-3.5 shrink-0" aria-hidden="true" />
            )}
            <span className="sr-only">
              {requirement.met ? "Met: " : "Required: "}
            </span>
            {requirement.label}
          </li>
        ))}
      </ul>

      <PasswordField
        key={`confirm-password-${state.attempt}`}
        ref={confirmationRef}
        id="confirm-password"
        name="confirmPassword"
        label="Confirm password"
        autoComplete="new-password"
        value={confirmation}
        onChange={(event) =>
          setConfirmationDraft({
            attempt: state.attempt,
            value: event.target.value,
          })
        }
        error={state.fields?.confirmPassword}
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
          <span className="min-w-28 text-left">
            {pending ? "Creating account" : "Create account"}
          </span>
        </span>
        {!pending && <ArrowRight className="size-4" aria-hidden="true" />}
      </Button>
    </form>
  );
};
