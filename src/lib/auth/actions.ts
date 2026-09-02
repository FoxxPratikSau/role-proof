"use server";

import { redirect } from "next/navigation";
import {
  AuthAPIError,
  AuthAPIUnavailableError,
  loginWithPassword,
  registerAccount,
} from "./api";
import { createSession, deleteSession } from "./session";
import {
  safeAppPath,
  validateLoginForm,
  validateSignupForm,
  type LoginFormState,
  type SignupFormState,
} from "./validation";

export const loginAction = async (
  previousState: LoginFormState,
  formData: FormData,
): Promise<LoginFormState> => {
  const emailInput = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const nextPath = safeAppPath(String(formData.get("next") ?? ""));
  const { email, fields } = validateLoginForm(emailInput, password);
  const attempt = previousState.attempt + 1;
  if (Object.keys(fields).length > 0) {
    return { attempt, email, fields, error: "Check the highlighted fields." };
  }
  let result;
  try {
    result = await loginWithPassword(email, password);
  } catch (error) {
    if (error instanceof AuthAPIError && error.status === 401) {
      return {
        attempt,
        email,
        error: "Email or password is incorrect. Try again.",
      };
    }
    if (error instanceof AuthAPIError && error.status === 400) {
      return {
        attempt,
        email,
        fields: {
          email: error.fields.email,
          password: error.fields.password,
        },
        error: "Check the highlighted fields.",
      };
    }
    if (error instanceof AuthAPIUnavailableError) {
      return {
        attempt,
        email,
        error:
          "The authentication service is unavailable. Start the Go API and try again.",
      };
    }
    return {
      attempt,
      email,
      error: "Sign in could not be completed. Try again.",
    };
  }
  await createSession(result.access_token, result.expires_in);
  redirect(nextPath);
};

export const signupAction = async (
  previousState: SignupFormState,
  formData: FormData,
): Promise<SignupFormState> => {
  const nameInput = String(formData.get("name") ?? "");
  const emailInput = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const nextPath = safeAppPath(String(formData.get("next") ?? ""));
  const { name, email, fields } = validateSignupForm(
    nameInput,
    emailInput,
    password,
    confirmPassword,
  );
  const attempt = previousState.attempt + 1;
  if (Object.keys(fields).length > 0) {
    return {
      attempt,
      name,
      email,
      fields,
      error: "Check the highlighted fields.",
    };
  }

  try {
    await registerAccount(name, email, password);
  } catch (error) {
    if (error instanceof AuthAPIError && error.status === 409) {
      return {
        attempt,
        name,
        email,
        fields: { email: "An account with this email already exists." },
        error: "Use a different email or sign in instead.",
      };
    }
    if (error instanceof AuthAPIError && error.status === 400) {
      return {
        attempt,
        name,
        email,
        fields: {
          name: error.fields.name,
          email: error.fields.email,
          password: error.fields.password,
        },
        error: "Check the highlighted fields.",
      };
    }
    if (error instanceof AuthAPIUnavailableError) {
      return {
        attempt,
        name,
        email,
        error:
          "The authentication service is unavailable. Start the Go API and try again.",
      };
    }
    return {
      attempt,
      name,
      email,
      error: "Your account could not be created. Try again.",
    };
  }

  const query = new URLSearchParams({ registered: "1", next: nextPath });
  redirect(`/login?${query.toString()}`);
};

export const logoutAction = async (): Promise<void> => {
  await deleteSession();
  redirect("/login");
};
