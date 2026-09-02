import type { LatexVerificationResult, ResumeSpec } from "@/types";
import type { ShrinkResult } from "./shrink";
import { generateLatexSource } from "./template";
import { renderResumeHtml } from "./render";
import { buildLatexVerificationResult } from "./verify-builder";

interface FinalResumeArtifacts {
  resumeSpec: ResumeSpec;
  latexSource: string;
  latexHtmlBlob: Blob;
  latexVerification: LatexVerificationResult;
}

/** Build every user-visible artifact from the exact spec that was measured. */
export const buildFinalResumeArtifacts = (
  shrinkResult: ShrinkResult,
): FinalResumeArtifacts => {
  const resumeSpec = shrinkResult.spec;
  const latexSource = generateLatexSource(resumeSpec);
  const html = renderResumeHtml(resumeSpec);
  return {
    resumeSpec,
    latexSource,
    latexHtmlBlob: new Blob([html], { type: "text/html" }),
    latexVerification: buildLatexVerificationResult(resumeSpec, shrinkResult),
  };
};
