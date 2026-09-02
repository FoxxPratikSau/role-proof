import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { SignupForm } from "@/components/auth/SignupForm";
import { getSession } from "@/lib/auth/session";
import { safeAppPath } from "@/lib/auth/validation";

export const metadata: Metadata = {
  title: "Create account — RoleProof",
};

const SignupPage = async ({
  searchParams,
}: {
  searchParams: Promise<{ next?: string | string[] }>;
}) => {
  const params = await searchParams;
  const nextPath = safeAppPath(
    typeof params.next === "string" ? params.next : undefined,
  );
  const session = await getSession();
  if (session.status === "authenticated") {
    redirect(nextPath);
  }

  return (
    <AuthShell
      eyebrow="New account"
      title="Start with your evidence."
      description="Create a private workspace for your master resume, templates, and role-specific drafts."
      alternatePrompt="Already have an account?"
      alternateLabel="Sign in"
      alternateHref={`/login?next=${encodeURIComponent(nextPath)}`}
    >
      <SignupForm nextPath={nextPath} />
    </AuthShell>
  );
};

export default SignupPage;
