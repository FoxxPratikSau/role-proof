import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  FileCheck2,
  ScanSearch,
  ShieldCheck,
} from "lucide-react";

const evidenceSteps = [
  {
    icon: ScanSearch,
    label: "Read the role",
    detail: "Identify the signals that matter.",
  },
  {
    icon: FileCheck2,
    label: "Map your evidence",
    detail: "Connect every claim to real work.",
  },
  {
    icon: Check,
    label: "Refine the draft",
    detail: "Critique, verify, and export.",
  },
] as const;

interface AuthShellProps {
  eyebrow: string;
  title: string;
  description: string;
  alternatePrompt: string;
  alternateLabel: string;
  alternateHref: string;
  children: ReactNode;
}

export const AuthShell = ({
  eyebrow,
  title,
  description,
  alternatePrompt,
  alternateLabel,
  alternateHref,
  children,
}: AuthShellProps) => (
  <main className="min-h-svh bg-card lg:grid lg:grid-cols-[minmax(0,1.08fr)_minmax(30rem,0.92fr)]">
    <section className="relative hidden min-h-svh overflow-hidden bg-foreground text-background lg:flex lg:flex-col">
      <div
        className="pointer-events-none absolute inset-y-0 right-[8%] left-[8%] border-x border-white/6"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-y-0 left-1/2 w-px bg-white/6"
        aria-hidden="true"
      />

      <header className="relative px-12 pt-10 xl:px-20">
        <BrandLink inverted />
      </header>

      <div className="relative flex flex-1 items-center px-12 py-16 xl:px-20">
        <div className="w-full max-w-2xl">
          <p className="font-mono text-[11px] font-medium tracking-[0.18em] text-[#aebdff] uppercase">
            Evidence-led applications
          </p>
          <h2 className="mt-5 max-w-xl text-5xl leading-[1.05] font-semibold tracking-[-0.045em] text-balance xl:text-6xl">
            Shape your experience for the role.
            <span className="mt-2 block text-[#aebdff]">
              Keep every claim yours.
            </span>
          </h2>
          <p className="mt-6 max-w-lg text-base leading-7 text-[#b9c3d6]">
            Return to the workspace where job requirements and your proven
            experience meet in one inspectable process.
          </p>

          <ol className="mt-12 overflow-hidden rounded-2xl border border-white/12 bg-white/[0.035]">
            {evidenceSteps.map((step, index) => (
              <li
                key={step.label}
                className="grid grid-cols-[2.75rem_1fr_auto] items-center gap-4 border-b border-white/10 px-5 py-4 last:border-b-0"
              >
                <span className="flex size-11 items-center justify-center rounded-xl border border-white/12 bg-white/6 text-[#aebdff]">
                  <step.icon className="size-4" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white">
                    {step.label}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-[#9eabc1]">
                    {step.detail}
                  </span>
                </span>
                <span className="font-mono text-[10px] tracking-[0.14em] text-[#73819a]">
                  0{index + 1}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <footer className="relative flex items-center gap-2.5 px-12 pb-10 text-xs text-[#9eabc1] xl:px-20">
        <ShieldCheck className="size-4 text-[#67d6ca]" aria-hidden="true" />
        AI keys stay in this browser. Session tokens stay out of browser
        storage.
      </footer>
    </section>

    <section className="flex min-h-svh flex-col bg-background">
      <header className="flex h-20 shrink-0 items-center justify-between px-5 sm:px-8 lg:px-10">
        <div className="lg:hidden">
          <BrandLink />
        </div>
        <Link
          href="/"
          className="ml-auto inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to home
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center px-5 pt-4 pb-16 sm:px-8 lg:px-12">
        <div className="w-full max-w-[26rem]">
          <div className="flex items-center gap-3">
            <span className="h-px w-9 bg-primary" aria-hidden="true" />
            <p className="font-mono text-[10px] font-medium tracking-[0.18em] text-primary uppercase">
              {eyebrow}
            </p>
          </div>
          <h1 className="mt-5 text-4xl leading-tight font-semibold tracking-[-0.04em] text-balance">
            {title}
          </h1>
          <p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">
            {description}
          </p>

          <div className="mt-9">{children}</div>

          <p className="mt-7 text-sm text-muted-foreground">
            {alternatePrompt}{" "}
            <Link
              href={alternateHref}
              className="rounded-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
            >
              {alternateLabel}
            </Link>
          </p>

          <div className="mt-8 flex items-start gap-2.5 border-t pt-5 text-xs leading-5 text-muted-foreground">
            <ShieldCheck
              className="mt-0.5 size-4 shrink-0 text-success"
              aria-hidden="true"
            />
            <p>
              Your session is protected with an HTTP-only cookie and your
              password is never stored in the browser.
            </p>
          </div>
        </div>
      </div>
    </section>
  </main>
);

const BrandLink = ({ inverted = false }: { inverted?: boolean }) => (
  <Link
    href="/"
    className="inline-flex min-h-10 items-center gap-2.5 rounded-lg pr-2 font-semibold tracking-tight focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
  >
    <span
      className={`flex size-8 items-center justify-center rounded-lg ${
        inverted ? "bg-white text-foreground" : "bg-foreground text-background"
      }`}
    >
      <Check className="size-4" aria-hidden="true" />
    </span>
    <span className={inverted ? "text-white" : "text-foreground"}>
      RoleProof
    </span>
  </Link>
);
