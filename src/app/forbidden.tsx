import Link from "next/link";
import { Check, LockKeyhole } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { logoutAction } from "@/lib/auth/actions";

const ForbiddenPage = () => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-12">
      <title>Access denied — RoleProof</title>
      <Card className="w-full max-w-lg shadow-[0_18px_50px_rgba(23,32,51,0.09)]">
        <CardContent className="flex flex-col items-center px-6 py-10 text-center sm:px-10">
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-lg font-semibold tracking-tight focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-foreground text-background">
              <Check className="size-4" aria-hidden="true" />
            </span>
            RoleProof
          </Link>
          <span className="mt-8 flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
            <LockKeyhole className="size-5" aria-hidden="true" />
          </span>
          <p className="mt-5 font-mono text-[10px] font-medium tracking-[0.16em] text-destructive uppercase">
            403 · Access denied
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            This account cannot open that page.
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
            Your account is signed in, but its role does not include permission
            for this area.
          </p>
          <div className="mt-7 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/" className={buttonVariants({ variant: "outline" })}>
              Return home
            </Link>
            <form action={logoutAction} noValidate>
              <Button type="submit" className="w-full sm:w-auto">
                Sign in with another account
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </main>
  );
};

export default ForbiddenPage;
