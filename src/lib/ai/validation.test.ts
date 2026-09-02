import { describe, expect, it } from "vitest";
import { parseResumeCritique } from "./validation";

const validCritique = {
  score: 88,
  atsScore: 91,
  strengths: ["Relevant experience"],
  weaknesses: ["One weak bullet"],
  suggestions: ["Rewrite the weak bullet"],
  isConverged: false,
  newWeaknesses: [],
};

describe("parseResumeCritique", () => {
  it("accepts a complete critique payload", () => {
    expect(parseResumeCritique(validCritique)).toMatchObject(validCritique);
  });

  it("rejects a payload that omits newWeaknesses", () => {
    const incompleteCritique: Partial<typeof validCritique> = {
      ...validCritique,
    };
    delete incompleteCritique.newWeaknesses;

    expect(() => parseResumeCritique(incompleteCritique)).toThrow(
      /newWeaknesses/,
    );
  });

  it("rejects out-of-range scores before they can affect control flow", () => {
    expect(() =>
      parseResumeCritique({ ...validCritique, atsScore: 140 }),
    ).toThrow(/atsScore/);
  });
});
