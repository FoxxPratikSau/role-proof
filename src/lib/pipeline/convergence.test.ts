import { describe, expect, it } from "vitest";
import type { ResumeCritique } from "@/types";
import { checkAlgorithmicConvergence } from "./convergence";

const critique = (overrides: Partial<ResumeCritique> = {}): ResumeCritique => {
  return {
    score: 80,
    atsScore: 85,
    strengths: ["Clear structure"],
    weaknesses: ["Needs stronger outcomes"],
    suggestions: ["Add supported outcomes"],
    isConverged: false,
    newWeaknesses: ["Needs stronger outcomes"],
    ...overrides,
  };
};

const entry = (iteration: number, value: ResumeCritique) => {
  return { iteration, resume: `resume-${iteration}`, critique: value };
};

describe("checkAlgorithmicConvergence", () => {
  it("does not accept an overall score ceiling when the ATS score is below its ceiling", () => {
    const current = critique({ score: 96, atsScore: 62 });

    expect(
      checkAlgorithmicConvergence(current, null, 1, [entry(1, current)]),
    ).toMatchObject({
      isConverged: false,
    });
  });

  it("accepts the score ceiling only when both overall and ATS thresholds pass", () => {
    const current = critique({ score: 96, atsScore: 91 });

    expect(
      checkAlgorithmicConvergence(current, null, 1, [entry(1, current)]),
    ).toMatchObject({
      isConverged: true,
      reason: "score_ceiling",
    });
  });

  it("does not accept LLM self-judgment when the ATS score is below its threshold", () => {
    const current = critique({ score: 90, atsScore: 89, isConverged: true });

    expect(
      checkAlgorithmicConvergence(current, null, 1, [entry(1, current)]),
    ).toMatchObject({
      isConverged: false,
    });
  });

  it("does not declare score stagnation after only one small improvement", () => {
    const previous = critique({ score: 80 });
    const current = critique({ score: 82 });
    const history = [entry(1, previous), entry(2, current)];

    expect(
      checkAlgorithmicConvergence(current, previous, 2, history),
    ).toMatchObject({
      isConverged: false,
    });
  });

  it("declares score stagnation after two consecutive small improvements", () => {
    const first = critique({
      score: 80,
      weaknesses: ["First weakness"],
      suggestions: ["First suggestion"],
    });
    const previous = critique({
      score: 82,
      weaknesses: ["Second weakness"],
      suggestions: ["Second suggestion"],
    });
    const current = critique({
      score: 84,
      weaknesses: ["Third weakness"],
      suggestions: ["Third suggestion"],
    });
    const history = [entry(1, first), entry(2, previous), entry(3, current)];

    expect(
      checkAlgorithmicConvergence(current, previous, 3, history),
    ).toMatchObject({
      isConverged: true,
      reason: "score_delta",
      scoreDelta: 2,
    });
  });
});
