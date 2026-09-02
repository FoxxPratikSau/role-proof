import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { getSession } from "@/lib/auth/session";
import { safeAppPath } from "@/lib/auth/validation";

export const metadata: Metadata = {
  title: "Sign in — RoleProof",
};

const LoginPage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string | string[];
    reason?: string | string[];
    registered?: string | string[];
  }>;
}) => {
  const params = await searchParams;
  const nextPath = safeAppPath(
    typeof params.next === "string" ? params.next : undefined,
  );
  const session = await getSession();
  if (session.status === "authenticated") {
    redirect(nextPath);
  }

  const reason = typeof params.reason === "string" ? params.reason : undefined;
  const isRegistered = params.registered === "1";
  const showRegistrationNotice =
    isRegistered &&
    !reason &&
    session.status !== "unavailable" &&
    session.status !== "invalid";
  const notice =
    reason === "service" || session.status === "unavailable"
      ? "The authentication service is unavailable. Start the Go API, then sign in."
      : reason === "session" || session.status === "invalid"
        ? "Your session ended. Sign in again to continue."
        : showRegistrationNotice
          ? "Account created. Sign in with your new password."
          : undefined;

  return (
    <AuthShell
      eyebrow="Private workspace"
      title="Welcome back."
      description="Sign in to continue building focused resumes from experience you can stand behind."
      alternatePrompt="New to RoleProof?"
      alternateLabel="Create an account"
      alternateHref={`/signup?next=${encodeURIComponent(nextPath)}`}
    >
      <LoginForm
        nextPath={nextPath}
        notice={notice}
        noticeTone={showRegistrationNotice ? "success" : "error"}
      />
    </AuthShell>
  );
};

export default LoginPage;
