import "server-only";
import { cookies } from "next/headers";
import { AuthAPIUnavailableError, fetchCurrentUser } from "./api";
import { SESSION_COOKIE_NAME } from "./constants";
import type { AuthUser } from "./types";

export type SessionState =
  | { status: "authenticated"; user: AuthUser }
  | { status: "missing" | "invalid" | "unavailable" };

export const createSession = async (token: string, expiresIn: number) => {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: expiresIn,
    priority: "high",
  });
};

export const deleteSession = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
};

export const getSession = async (): Promise<SessionState> => {
  const token = (await cookies()).get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return { status: "missing" };
  }
  try {
    const user = await fetchCurrentUser(token);
    return user ? { status: "authenticated", user } : { status: "invalid" };
  } catch (error) {
    if (error instanceof AuthAPIUnavailableError) {
      return { status: "unavailable" };
    }
    throw error;
  }
};
