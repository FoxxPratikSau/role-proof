import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Check, FileCheck2, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const notice =
    reason === "service" || session.status === "unavailable"
      ? "The authentication service is unavailable. Start the Go API, then sign in."
      : reason === "session" || session.status === "invalid"
        ? "Your session ended. Sign in again to continue."
        : undefined;
  return (
    <main className="min-h-screen bg-background px-5 py-8 sm:px-8 lg:py-12">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg font-semibold tracking-tight focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
            <Check className="size-4" aria-hidden="true" />
          </span>
          RoleProof
        </Link>
        <span className="hidden text-sm text-muted-foreground sm:block">
          Candidate workspace
        </span>
      </div>

      <div className="mx-auto grid min-h-[calc(100vh-7rem)] max-w-6xl items-center gap-12 py-12 lg:grid-cols-[1fr_27rem]">
        <section className="relative hidden max-w-xl pl-10 lg:block">
          <div className="absolute inset-y-1 left-0 w-px bg-gradient-to-b from-primary to-success" />
          <span className="absolute top-1 left-0 size-3 translate-x-[-5.5px] rounded-full border-2 border-background bg-primary shadow-[0_0_0_5px_rgba(49,88,216,0.12)]" />
          <p className="font-mono text-xs font-medium tracking-[0.16em] text-primary uppercase">
            Your private workspace
          </p>
          <h1 className="mt-4 text-4xl leading-tight font-semibold tracking-[-0.04em] text-balance sm:text-5xl">
            Continue with evidence you already trust.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
            Sign in to open your RoleProof workspace. Your resume syncs to your
            account, while AI provider keys remain in this browser.
          </p>
          <div className="mt-8 grid gap-3 text-sm">
            <div className="flex items-center gap-3">
              <FileCheck2 className="size-4 text-success" aria-hidden="true" />
              Resume claims stay tied to your source material.
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="size-4 text-success" aria-hidden="true" />
              Session tokens are kept out of browser storage.
            </div>
          </div>
        </section>

        <Card className="w-full shadow-[0_18px_50px_rgba(23,32,51,0.09)]">
          <CardHeader className="border-b pb-5">
            <p className="font-mono text-[10px] font-medium tracking-[0.16em] text-primary uppercase">
              Account access
            </p>
            <CardTitle className="mt-2 text-2xl font-semibold tracking-tight">
              Sign in to RoleProof
            </CardTitle>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Use the account stored in your local PostgreSQL database.
            </p>
          </CardHeader>
          <CardContent className="pt-1">
            <LoginForm
              nextPath={nextPath}
              notice={notice}
              showDemoCredentials={process.env.NODE_ENV !== "production"}
            />
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default LoginPage;
