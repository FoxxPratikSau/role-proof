"use server";

import { redirect } from "next/navigation";
import {
  AuthAPIError,
  AuthAPIUnavailableError,
  loginWithPassword,
} from "./api";
import { createSession, deleteSession } from "./session";
import {
  safeAppPath,
  validateLoginForm,
  type LoginFormState,
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

export const logoutAction = async (): Promise<void> => {
  await deleteSession();
  redirect("/login");
};
