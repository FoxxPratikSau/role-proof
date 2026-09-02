"use client";

import { CheckCircle2, Loader2 } from "lucide-react";
import type { PipelineStep } from "@/types";

const STEPS: { key: PipelineStep; label: string }[] = [
  { key: "jd-analysis", label: "JD Analysis" },
  { key: "experience-mapping", label: "Experience Mapping" },
  { key: "resume-generation", label: "Resume Text" },
  { key: "resume-critique", label: "Critique" },
  { key: "resume-spec", label: "Structurize" },
  { key: "latex-generation", label: "LaTeX Gen" },
  { key: "latex-verification", label: "Verify" },
];

interface PipelineProgressProps {
  currentStep: PipelineStep | null;
  running: boolean;
  iteration: number;
}

export const PipelineProgress = ({
  currentStep,
  running,
  iteration,
}: PipelineProgressProps) => {
  const currentIdx = currentStep
    ? STEPS.findIndex((s) => s.key === currentStep)
    : -1;
  const completedSteps =
    currentIdx < 0 ? 0 : running ? currentIdx : currentIdx + 1;
  const currentLabel = currentStep
    ? STEPS.find((step) => step.key === currentStep)?.label
    : null;
  const progress = Math.round((completedSteps / STEPS.length) * 100);

  return (
    <div
      className="w-full max-w-64"
      aria-label="Resume generation progress"
      aria-live="polite"
    >
      <div className="mb-2 flex items-center justify-between gap-4 text-xs">
        <span className="text-foreground flex min-w-0 items-center gap-1.5 font-medium">
          {running ? (
            <Loader2 className="text-primary size-3.5 shrink-0 animate-spin" />
          ) : (
            <CheckCircle2 className="text-success size-3.5 shrink-0" />
          )}
          <span className="truncate">
            {running ? currentLabel : "Pipeline complete"}
            {currentStep === "resume-critique" && iteration > 0
              ? ` · pass ${iteration}`
              : ""}
          </span>
        </span>
        <span className="text-muted-foreground shrink-0 tabular-nums">
          {Math.min(completedSteps + (running ? 1 : 0), STEPS.length)} of{" "}
          {STEPS.length}
        </span>
      </div>
      <div className="bg-muted h-1 overflow-hidden rounded-full">
        <div
          className="bg-primary h-full rounded-full transition-[width] duration-150"
          style={{ width: `${running ? Math.max(progress, 8) : 100}%` }}
        />
      </div>
    </div>
  );
};
