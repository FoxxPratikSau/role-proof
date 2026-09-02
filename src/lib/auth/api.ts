import "server-only";
import type { AuthUser } from "./types";
import { backendApiURL } from "@/lib/api/url";

interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
}

interface RegisterResponse {
  user: AuthUser;
}

interface ErrorResponse {
  error?: string;
  fields?: Record<string, string>;
}

export class AuthAPIError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly fields: Record<string, string> = {},
  ) {
    super(message);
    this.name = "AuthAPIError";
  }
}

export class AuthAPIUnavailableError extends Error {
  constructor() {
    super("authentication service unavailable");
    this.name = "AuthAPIUnavailableError";
  }
}

const readJSON = async <T>(response: Response): Promise<T | null> => {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

export const loginWithPassword = async (
  email: string,
  password: string,
): Promise<LoginResponse> => {
  let response: Response;
  try {
    response = await fetch(backendApiURL("auth/login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new AuthAPIUnavailableError();
  }
  const body = await readJSON<LoginResponse & ErrorResponse>(response);
  if (!response.ok || !body) {
    throw new AuthAPIError(
      response.status,
      body?.error || "authentication failed",
      body?.fields,
    );
  }
  if (
    !body.access_token ||
    body.token_type !== "Bearer" ||
    body.expires_in <= 0
  ) {
    throw new AuthAPIError(502, "invalid authentication response");
  }
  return body;
};

export const registerAccount = async (
  name: string,
  email: string,
  password: string,
): Promise<RegisterResponse> => {
  let response: Response;
  try {
    response = await fetch(backendApiURL("auth/register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    throw new AuthAPIUnavailableError();
  }
  const body = await readJSON<RegisterResponse & ErrorResponse>(response);
  if (!response.ok || !body) {
    throw new AuthAPIError(
      response.status,
      body?.error || "registration failed",
      body?.fields,
    );
  }
  if (!body.user?.id || !body.user.email) {
    throw new AuthAPIError(502, "invalid registration response");
  }
  return body;
};

export const fetchCurrentUser = async (
  token: string,
): Promise<AuthUser | null> => {
  let response: Response;
  try {
    response = await fetch(backendApiURL("auth/me"), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
  } catch {
    throw new AuthAPIUnavailableError();
  }
  if (response.status === 401) {
    return null;
  }
  if (!response.ok) {
    throw new AuthAPIUnavailableError();
  }
  const body = await readJSON<{
    user?: AuthUser;
  }>(response);
  return body?.user ?? null;
};
