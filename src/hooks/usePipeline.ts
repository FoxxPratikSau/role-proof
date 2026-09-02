"use client";

import { useState, useCallback, useRef } from "react";
import {
  createChatCompletion,
  extractJsonFromLLMResponse,
  parseResumeCritique,
  JD_ANALYSIS_PROMPT,
  EXPERIENCE_MAPPING_PROMPT,
  RESUME_GENERATION_PROMPT,
  RESUME_REVISION_PROMPT,
  RESUME_CRITIQUE_PROMPT,
  RESUME_SPEC_GENERATION_PROMPT,
} from "@/lib/ai";
import { getActiveAIConfig } from "@/lib/storage";
import { enforceTemplateCritique } from "@/lib/templates/presentation";
import { shrinkSpecToFit, buildFinalResumeArtifacts } from "@/lib/latex";
import {
  computeResumeTextSimilarity,
  buildCritiqueContext,
  buildRevisionContext,
  checkAlgorithmicConvergence,
  extractRevisionReport,
  buildRevisionPlan,
  MAX_CRITIQUE_ITERATIONS,
  RESUME_SIMILARITY_THRESHOLD,
  RESUME_GENERATION_TEMPERATURE,
  DEFAULT_STEP_TEMPERATURE,
} from "@/lib/pipeline";
import type {
  JDAnalysis,
  ExperienceMapping,
  ResumeCritique,
  PipelineStep,
  ConvergenceResult,
  ResumeSpec,
  LatexVerificationResult,
  ResumeTemplate,
} from "@/types";
import { TOKEN_BUDGETS } from "@/types";

export interface PipelineState {
  running: boolean;
  currentStep: PipelineStep | null;
  error: string | null;
  analysis: JDAnalysis | null;
  mapping: ExperienceMapping | null;
  currentResume: string | null;
  critique: ResumeCritique | null;
  iteration: number;
  history: Array<{
    iteration: number;
    resume: string;
    critique: ResumeCritique;
  }>;
  bestResume: string | null;
  bestScore: number;
  convergenceResult: ConvergenceResult | null;
  // LaTeX pipeline fields
  resumeSpec: ResumeSpec | null;
  latexSource: string | null;
  latexHtmlBlob: Blob | null;
  latexVerification: LatexVerificationResult | null;
}

type PipelineHistoryEntry = PipelineState["history"][number];

interface CritiqueLoopResult {
  critique: ResumeCritique | null;
  iteration: number;
  history: PipelineHistoryEntry[];
  bestResume: string;
  bestScore: number;
}

const SYSTEM_PROMPT_BY_STEP: Partial<Record<PipelineStep, string>> = {
  "jd-analysis": JD_ANALYSIS_PROMPT,
  "experience-mapping": EXPERIENCE_MAPPING_PROMPT,
  "resume-generation": RESUME_GENERATION_PROMPT,
  "resume-critique": RESUME_CRITIQUE_PROMPT,
  "resume-spec": RESUME_SPEC_GENERATION_PROMPT,
};

const createInitialPipelineState = (): PipelineState => ({
  running: false,
  currentStep: null,
  error: null,
  analysis: null,
  mapping: null,
  currentResume: null,
  critique: null,
  iteration: 0,
  history: [],
  bestResume: null,
  bestScore: 0,
  convergenceResult: null,
  resumeSpec: null,
  latexSource: null,
  latexHtmlBlob: null,
  latexVerification: null,
});

const buildTemplateGuidance = (template?: ResumeTemplate): string =>
  template
    ? `\n\nSELECTED TEMPLATE — this is a strict output contract, not optional guidance. Use only the sections in sectionOrder, use exactly that order and the mapped sectionHeadings, and do not create conventional sections omitted by the reference (especially Summary). Follow the visual and writing rules, but never invent facts:\n${JSON.stringify(template.specification, null, 2)}`
    : "";

const buildResumeSpec = (
  rawSpec: string,
  resumeData: Record<string, unknown>,
  template?: ResumeTemplate,
): ResumeSpec => {
  const resumeSpec = extractJsonFromLLMResponse(rawSpec) as ResumeSpec;
  resumeSpec.template = template?.specification;

  if (template && !template.specification.sectionOrder.includes("summary")) {
    resumeSpec.summary = { text: "" };
  }

  resumeSpec.meta = {
    ...resumeSpec.meta,
    name: (resumeData.name as string) || resumeSpec.meta.name,
    email: (resumeData.email as string) || resumeSpec.meta.email,
    phone: (resumeData.phone as string) || resumeSpec.meta.phone || undefined,
    linkedin:
      (resumeData.linkedin as string) || resumeSpec.meta.linkedin || undefined,
    github:
      (resumeData.github as string) || resumeSpec.meta.github || undefined,
    twitter:
      (resumeData.twitter as string) || resumeSpec.meta.twitter || undefined,
    portfolio:
      (resumeData.portfolio as string) ||
      resumeSpec.meta.portfolio ||
      undefined,
  };
  return resumeSpec;
};

// ─── Hook ───────────────────────────────────────────────────────

export const usePipeline = () => {
  const [state, setState] = useState<PipelineState>(createInitialPipelineState);
  const abortRef = useRef(false);
  const runStep = useCallback(
    async (
      step: PipelineStep,
      context: string,
      systemPromptOverride?: string,
      temperatureOverride?: number,
    ) => {
      const { apiKey, model, provider } = getActiveAIConfig();
      if (!apiKey) throw new Error("API key not set");
      const systemPrompt = systemPromptOverride ?? SYSTEM_PROMPT_BY_STEP[step];
      if (!systemPrompt) throw new Error(`No system prompt for step: ${step}`);
      const defaultTemp =
        step === "resume-generation"
          ? RESUME_GENERATION_TEMPERATURE
          : DEFAULT_STEP_TEMPERATURE;
      const temperature = temperatureOverride ?? defaultTemp;
      const res = await createChatCompletion({
        provider,
        model,
        apiKey,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: context },
        ],
        temperature,
        maxTokens: TOKEN_BUDGETS[step],
      });
      return res.content;
    },
    [],
  );
  const runCritiqueLoop = useCallback(
    async (
      initialResume: string,
      analysis: JDAnalysis,
      mapping: ExperienceMapping,
      jd: string,
      resumeData: Record<string, unknown>,
      templateGuidance: string,
      template?: ResumeTemplate,
    ): Promise<CritiqueLoopResult | null> => {
      let resume = initialResume;
      let critique: ResumeCritique | null = null;
      let iteration = 0;
      const history: PipelineHistoryEntry[] = [];
      let bestResume = resume;
      let bestScore = 0;
      let previousCritique: ResumeCritique | null = null;
      do {
        iteration++;
        setState((current) => ({
          ...current,
          currentStep: "resume-critique",
          currentResume: resume,
          iteration,
        }));
        if (history.length > 0) {
          const previousResume = history[history.length - 1].resume;
          const similarity = computeResumeTextSimilarity(
            resume,
            previousResume,
          );
          if (similarity >= RESUME_SIMILARITY_THRESHOLD) {
            setState((current) => ({
              ...current,
              critique,
              currentResume: resume,
              history: [...history],
              bestResume,
              bestScore,
              convergenceResult: {
                isConverged: true,
                reason: "no_resume_change",
                scoreDelta: null,
                newWeaknesses: [],
              },
            }));
            break;
          }
        }
        const critiqueContext =
          buildCritiqueContext(
            resume,
            analysis,
            jd,
            resumeData,
            iteration,
            history,
          ) + templateGuidance;
        const critiqueRaw = await runStep("resume-critique", critiqueContext);
        if (abortRef.current) return null;
        const parsedCritique = parseResumeCritique(
          extractJsonFromLLMResponse(critiqueRaw),
        );
        critique = template
          ? enforceTemplateCritique(parsedCritique, template.specification)
          : parsedCritique;
        history.push({ iteration, resume, critique });
        if (critique.score > bestScore) {
          bestScore = critique.score;
          bestResume = resume;
        }
        const convergenceResult = checkAlgorithmicConvergence(
          critique,
          previousCritique,
          iteration,
          history,
        );
        setState((current) => ({
          ...current,
          critique,
          currentResume: resume,
          history: [...history],
          bestResume,
          bestScore,
          convergenceResult,
        }));
        if (convergenceResult.isConverged) break;
        previousCritique = critique;
        if (iteration < MAX_CRITIQUE_ITERATIONS) {
          const previousPlan =
            history.length > 1
              ? buildRevisionPlan(history[history.length - 2].critique)
              : undefined;
          const revisionPlan = buildRevisionPlan(critique, previousPlan);
          const revisionContext =
            buildRevisionContext(
              resume,
              critique,
              revisionPlan,
              analysis,
              mapping,
              resumeData,
            ) + templateGuidance;
          const revisionRaw = await runStep(
            "resume-generation",
            revisionContext,
            RESUME_REVISION_PROMPT,
            0.3,
          );
          if (abortRef.current) return null;
          resume = extractRevisionReport(revisionRaw).resume;
        }
      } while (iteration < MAX_CRITIQUE_ITERATIONS);
      return { critique, iteration, history, bestResume, bestScore };
    },
    [runStep],
  );
  const run = useCallback(
    async (
      jd: string,
      extractionJson: Record<string, unknown>,
      template?: ResumeTemplate,
    ) => {
      abortRef.current = false;
      const resumeData = extractionJson;
      const resumeDataStr = JSON.stringify(resumeData, null, 2);
      const templateGuidance = buildTemplateGuidance(template);
      setState({
        ...createInitialPipelineState(),
        running: true,
        currentStep: "jd-analysis",
      });
      const { apiKey } = getActiveAIConfig();
      if (!apiKey) {
        setState((s) => ({
          ...s,
          running: false,
          error: "API key not set. Go to Settings.",
        }));
        return;
      }
      try {
        // Step 1: JD Analysis
        const analysisRaw = await runStep(
          "jd-analysis",
          `Analyze this job description:\n\n${jd}`,
        );
        if (abortRef.current) return;
        const analysis = extractJsonFromLLMResponse(analysisRaw) as JDAnalysis;
        setState((s) => ({
          ...s,
          currentStep: "experience-mapping",
          analysis,
        }));
        // Step 2: Experience Mapping
        const mappingRaw = await runStep(
          "experience-mapping",
          `Job Analysis:\n${JSON.stringify(analysis, null, 2)}\n\nCandidate Master Resume:\n${resumeDataStr}`,
        );
        if (abortRef.current) return;
        const mapping = extractJsonFromLLMResponse(
          mappingRaw,
        ) as ExperienceMapping;
        setState((s) => ({
          ...s,
          currentStep: "resume-generation",
          mapping,
        }));
        // Step 3: Initial Resume Generation
        const resumeRaw = await runStep(
          "resume-generation",
          `TARGET ROLE: ${analysis.roleTitle}\n\nJOB ANALYSIS:\n${JSON.stringify(analysis, null, 2)}\n\nEXPERIENCE MAPPING (what to feature, what to downplay):\n${JSON.stringify(mapping, null, 2)}\n\nMASTER RESUME (source of truth — USE ONLY THIS DATA):\n${resumeDataStr}${templateGuidance}`,
        );
        if (abortRef.current) return;
        const critiqueResult = await runCritiqueLoop(
          resumeRaw,
          analysis,
          mapping,
          jd,
          resumeData,
          templateGuidance,
          template,
        );
        if (!critiqueResult) return;
        const { critique, iteration, history, bestResume, bestScore } =
          critiqueResult;
        // ─── LaTeX Phase ─────────────────────────────────────────
        // Step 5: Generate ResumeSpec from best text resume
        setState((s) => ({
          ...s,
          currentStep: "resume-spec",
        }));
        const specRaw = await runStep(
          "resume-spec",
          `Target Role: ${analysis.roleTitle}${templateGuidance}\n\nConvert this resume into the structured format:\n\n${bestResume}`,
        );
        if (abortRef.current) return;
        let resumeSpec: ResumeSpec;
        try {
          resumeSpec = buildResumeSpec(specRaw, resumeData, template);
        } catch {
          // If parsing fails, set error and skip LaTeX phase
          setState((s) => ({
            ...s,
            running: false,
            currentStep: null,
            currentResume: bestResume,
            error:
              "Failed to parse ResumeSpec from AI response. The text resume is available for download.",
            critique,
            iteration,
            history: [...history],
            bestResume,
            bestScore,
          }));
          return;
        }
        // Step 6: Fit the ResumeSpec before producing any final artifacts.
        setState((s) => ({
          ...s,
          currentStep: "latex-generation",
          resumeSpec,
        }));
        const shrinkResult = await shrinkSpecToFit(resumeSpec);
        if (abortRef.current) return;
        // Step 7: Generate and verify every artifact from the exact fitted spec.
        const finalArtifacts = buildFinalResumeArtifacts(shrinkResult);
        resumeSpec = finalArtifacts.resumeSpec;
        const { latexSource, latexHtmlBlob, latexVerification } =
          finalArtifacts;
        setState((s) => ({
          ...s,
          currentStep: "latex-verification",
          resumeSpec,
          latexSource,
          latexHtmlBlob,
          latexVerification,
        }));
        // Final state
        setState((s) => ({
          ...s,
          running: false,
          currentStep: null,
          currentResume: bestResume,
          latexSource,
          latexHtmlBlob,
          latexVerification,
          resumeSpec,
          critique,
          iteration,
          history: [...history],
          bestResume,
          bestScore,
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Pipeline failed";
        setState((s) => ({ ...s, running: false, error: message }));
      }
    },
    [runCritiqueLoop, runStep],
  );
  const cancel = useCallback(() => {
    abortRef.current = true;
    setState((s) => ({
      ...s,
      running: false,
      currentStep: null,
    }));
  }, []);
  return { ...state, run, cancel };
};
