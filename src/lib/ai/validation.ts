import type { CategorizedSuggestions, ResumeCritique } from "@/types";

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const requireNumber = (
  value: unknown,
  field: string,
  {
    min,
    max,
  }: {
    min: number;
    max: number;
  },
): number => {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < min ||
    value > max
  ) {
    throw new Error(
      `Invalid resume critique: "${field}" must be a number from ${min} to ${max}`,
    );
  }
  return value;
};

const requireStringArray = (value: unknown, field: string): string[] => {
  if (
    !Array.isArray(value) ||
    !value.every((item) => typeof item === "string")
  ) {
    throw new Error(
      `Invalid resume critique: "${field}" must be an array of strings`,
    );
  }
  return value;
};

const optionalStringArray = (
  value: unknown,
  field: string,
): string[] | undefined => {
  return value === undefined ? undefined : requireStringArray(value, field);
};

const parseCategorizedSuggestions = (
  value: unknown,
): CategorizedSuggestions | undefined => {
  if (value === undefined) return undefined;
  if (!isRecord(value)) {
    throw new Error(
      'Invalid resume critique: "categorizedSuggestions" must be an object',
    );
  }
  return {
    fabrication: requireStringArray(
      value.fabrication,
      "categorizedSuggestions.fabrication",
    ),
    content: requireStringArray(
      value.content,
      "categorizedSuggestions.content",
    ),
    impact: requireStringArray(value.impact, "categorizedSuggestions.impact"),
    ats: requireStringArray(value.ats, "categorizedSuggestions.ats"),
    clarity: requireStringArray(
      value.clarity,
      "categorizedSuggestions.clarity",
    ),
  };
};

/** Validate the untrusted JSON returned by the critique model before using it for control flow. */
export const parseResumeCritique = (value: unknown): ResumeCritique => {
  if (!isRecord(value)) {
    throw new Error("Invalid resume critique: expected a JSON object");
  }
  if (typeof value.isConverged !== "boolean") {
    throw new Error('Invalid resume critique: "isConverged" must be a boolean');
  }
  return {
    score: requireNumber(value.score, "score", { min: 0, max: 100 }),
    atsScore: requireNumber(value.atsScore, "atsScore", { min: 0, max: 100 }),
    strengths: requireStringArray(value.strengths, "strengths"),
    weaknesses: requireStringArray(value.weaknesses, "weaknesses"),
    suggestions: requireStringArray(value.suggestions, "suggestions"),
    isConverged: value.isConverged,
    categorizedSuggestions: parseCategorizedSuggestions(
      value.categorizedSuggestions,
    ),
    previousWeaknessesAddressed: optionalStringArray(
      value.previousWeaknessesAddressed,
      "previousWeaknessesAddressed",
    ),
    // This field is deliberately required: absence must never be interpreted as
    // evidence that a revision introduced no new weaknesses.
    newWeaknesses: requireStringArray(value.newWeaknesses, "newWeaknesses"),
    recurringWeaknesses: optionalStringArray(
      value.recurringWeaknesses,
      "recurringWeaknesses",
    ),
  };
};
