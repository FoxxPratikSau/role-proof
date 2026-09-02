import "server-only";
import { cache } from "react";
import { forbidden, redirect } from "next/navigation";
import { canAccessPage, type PagePermission } from "./permissions";
import { getSession } from "./session";
import type { AuthUser } from "./types";

const requireAuthenticatedUser = cache(async (): Promise<AuthUser> => {
  const session = await getSession();
  if (session.status === "unavailable") {
    redirect("/login?reason=service");
  }
  if (session.status !== "authenticated") {
    redirect(session.status === "invalid" ? "/login?reason=session" : "/login");
  }
  return session.user;
});

export const requirePagePermission = async (
  permission: PagePermission,
): Promise<AuthUser> => {
  const user = await requireAuthenticatedUser();
  if (!canAccessPage(permission, user.role)) {
    forbidden();
  }
  return user;
};
