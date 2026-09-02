import Link from "next/link";
import {
  ArrowRight,
  Check,
  FileSearch,
  FileText,
  GitMerge,
  ShieldCheck,
} from "lucide-react";

const steps = [
  {
    icon: FileSearch,
    title: "Read the role",
    description:
      "Pull the skills, outcomes, and signals that actually matter from the job post.",
  },
  {
    icon: GitMerge,
    title: "Match your evidence",
    description:
      "Connect requirements to real experience from your master resume—without invention.",
  },
  {
    icon: FileText,
    title: "Build and refine",
    description:
      "Generate, critique, and verify a focused resume before you export it.",
  },
];

const Home = () => {
  return (
    <main className="bg-background min-h-screen overflow-hidden">
      <header className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-2.5 font-semibold tracking-tight"
        >
          <span className="bg-foreground text-background flex size-8 items-center justify-center rounded-lg">
            <Check className="size-4" aria-hidden="true" />
          </span>
          RoleProof
        </Link>
        <Link
          href="/login"
          className="hover:bg-muted focus-visible:ring-ring/25 rounded-lg px-3 py-2 text-sm font-semibold transition-colors focus-visible:ring-3 focus-visible:outline-none"
        >
          Sign in
        </Link>
      </header>

      <section className="mx-auto grid max-w-7xl items-center gap-14 px-5 pt-16 pb-24 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:pt-24 lg:pb-32">
        <div>
          <div className="bg-card text-muted-foreground mb-7 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold shadow-sm">
            <ShieldCheck className="text-success size-3.5" aria-hidden="true" />{" "}
            Private, browser-based workspace
          </div>
          <h1 className="max-w-3xl text-5xl leading-[1.03] font-semibold tracking-[-0.045em] text-balance sm:text-7xl">
            Make your experience fit the role.
            <span className="text-primary block">Never make it up.</span>
          </h1>
          <p className="text-muted-foreground mt-7 max-w-xl text-lg leading-8">
            RoleProof turns your master resume and a job description into a
            focused application—then critiques the result until every claim is
            clear, relevant, and supported.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/app"
              className="bg-primary text-primary-foreground focus-visible:ring-ring/25 inline-flex h-12 items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold shadow-[0_8px_24px_rgba(49,88,216,0.2)] transition-[background-color,transform] hover:bg-[#2448b6] focus-visible:ring-3 focus-visible:outline-none active:translate-y-px"
            >
              Start with your resume{" "}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <a
              href="#workflow"
              className="bg-card hover:bg-muted focus-visible:ring-ring/25 inline-flex h-12 items-center justify-center rounded-lg border px-5 text-sm font-semibold transition-colors focus-visible:ring-3 focus-visible:outline-none"
            >
              See the workflow
            </a>
          </div>
        </div>

        <div
          className="relative mx-auto w-full max-w-xl"
          aria-label="Resume alignment preview"
        >
          <div className="from-primary via-primary to-success absolute inset-y-8 left-1/2 w-px -translate-x-1/2 bg-gradient-to-b" />
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <DocumentCard
              label="ROLE SIGNALS"
              title="Senior Product Engineer"
              side="left"
            />
            <DocumentCard
              label="YOUR EVIDENCE"
              title="Selected experience"
              side="right"
            />
          </div>
          <div className="border-success/25 bg-card text-success relative mx-auto -mt-2 flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold shadow-lg">
            <span className="bg-success size-2 rounded-full" />8 strong matches
            found
          </div>
        </div>
      </section>

      <section id="workflow" className="bg-card scroll-mt-8 border-t">
        <div className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="text-primary font-mono text-xs font-medium tracking-[0.16em] uppercase">
                One honest workflow
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] sm:text-4xl">
                From job post to ready-to-send.
              </h2>
              <p className="text-muted-foreground mt-4 max-w-md leading-7">
                Each stage leaves a visible trail, so you can inspect the
                reasoning instead of trusting a black box.
              </p>
            </div>
            <ol className="before:bg-border relative grid gap-5 before:absolute before:inset-y-6 before:left-5 before:w-px">
              {steps.map((step, index) => (
                <li
                  key={step.title}
                  className="relative grid grid-cols-[2.5rem_1fr] gap-4"
                >
                  <span className="bg-background text-primary z-10 flex size-10 items-center justify-center rounded-full border">
                    <step.icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="bg-background rounded-xl border p-5">
                    <p className="text-muted-foreground font-mono text-[10px]">
                      0{index + 1}
                    </p>
                    <h3 className="mt-1 font-semibold">{step.title}</h3>
                    <p className="text-muted-foreground mt-1.5 text-sm leading-6">
                      {step.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Home;

const DocumentCard = ({
  label,
  title,
  side,
}: {
  label: string;
  title: string;
  side: "left" | "right";
}) => {
  const widths =
    side === "left"
      ? ["w-4/5", "w-2/3", "w-11/12", "w-3/5"]
      : ["w-3/4", "w-11/12", "w-2/3", "w-4/5"];
  return (
    <div className="bg-card relative min-h-80 rounded-2xl border p-5 shadow-[0_18px_50px_rgba(23,32,51,0.1)] sm:min-h-96 sm:p-7">
      <p className="text-muted-foreground font-mono text-[9px] tracking-[0.16em]">
        {label}
      </p>
      <h2 className="mt-3 text-sm font-semibold sm:text-base">{title}</h2>
      <div className="mt-8 space-y-3">
        {widths.map((width, index) => (
          <div
            key={index}
            className={`h-2 rounded-full ${width} ${index === 1 ? "bg-primary/30" : "bg-muted"}`}
          />
        ))}
      </div>
      <div className="bg-muted/70 mt-8 rounded-lg p-3">
        <div className="bg-success/45 mb-2 h-2 w-16 rounded-full" />
        <div className="bg-border h-2 w-full rounded-full" />
        <div className="bg-border mt-2 h-2 w-3/4 rounded-full" />
      </div>
      <span
        className={`absolute top-24 ${side === "left" ? "right-[-1.05rem]" : "left-[-1.05rem]"} border-background bg-primary z-10 size-3 rounded-full border-2 shadow-[0_0_0_4px_rgba(49,88,216,0.12)]`}
      />
    </div>
  );
};
