import { describe, expect, it } from "vitest";
import type { ResumeSpec } from "@/types";
import {
  enforceTemplateCritique,
  getSectionOrder,
  getVisualLayout,
  partitionSections,
  templateNeedsReanalysis,
} from "./presentation";

const baseSpec: ResumeSpec = {
  meta: { name: "Test", email: "test@example.com", targetRole: "Engineer" },
  summary: { text: "Summary that may be omitted." },
  skills: { categories: [] },
  experience: [],
  projects: [],
  education: [],
};

describe("template presentation", () => {
  it("removes critique advice for sections excluded by the template", () => {
    const template = {
      schemaVersion: 1 as const,
      style: "minimal",
      tone: "direct",
      sectionOrder: ["experience", "skills"],
      sectionHeadings: {},
      contentRules: ["No summary"],
      formattingRules: ["One column"],
      promptInstructions: "Follow the reference.",
    };
    const critique = enforceTemplateCritique(
      {
        score: 80,
        atsScore: 85,
        strengths: [],
        weaknesses: [
          "The professional summary is missing",
          "One bullet is vague",
        ],
        suggestions: [
          "Add a brief professional summary at the top",
          "Quantify the first experience bullet",
        ],
        isConverged: false,
        categorizedSuggestions: {
          fabrication: [],
          content: ["Add a professional profile"],
          impact: ["Quantify the first experience bullet"],
          ats: [],
          clarity: [],
        },
        newWeaknesses: ["Missing career profile"],
      },
      template,
    );

    expect(critique.suggestions).toEqual([
      "Quantify the first experience bullet",
    ]);
    expect(critique.weaknesses).toEqual(["One bullet is vague"]);
    expect(critique.newWeaknesses).toEqual([]);
    expect(critique.categorizedSuggestions?.content).toEqual([]);
  });

  it("treats template sectionOrder as an exact allowlist", () => {
    const spec: ResumeSpec = {
      ...baseSpec,
      template: {
        schemaVersion: 1,
        style: "minimal",
        tone: "direct",
        sectionOrder: ["skills", "experience", "skills", "unknown"],
        sectionHeadings: {},
        contentRules: ["Be concise"],
        formattingRules: ["One column"],
        promptInstructions: "Follow the reference.",
      },
    };

    expect(getSectionOrder(spec)).toEqual(["skills", "experience"]);
    expect(templateNeedsReanalysis(spec.template!)).toBe(true);
  });

  it("sanitizes visual values and partitions two-column sections", () => {
    const spec: ResumeSpec = {
      ...baseSpec,
      template: {
        schemaVersion: 1,
        style: "two column",
        tone: "direct",
        sectionOrder: ["skills", "experience", "education"],
        sectionHeadings: {},
        contentRules: ["Be concise"],
        formattingRules: ["Two columns"],
        promptInstructions: "Follow the reference.",
        visualLayout: {
          pageSize: "letter",
          columns: 2,
          sidebarPosition: "right",
          sidebarWidthPercent: 99,
          sectionColumns: {
            skills: "sidebar",
            experience: "main",
            education: "full",
          },
          headerAlignment: "right",
          bodyFontFamily: "serif",
          headingFontFamily: "sans-serif",
          bodyFontSizePt: 40,
          nameFontSizePt: 4,
          sectionHeadingFontSizePt: 10,
          marginsInches: { top: 5, right: 0, bottom: 0.5, left: 0.5 },
          colors: {
            text: "not-css",
            heading: "#112233",
            accent: "#445566",
            divider: "#778899",
          },
          sectionHeadingCase: "preserve",
          dividerStyle: "line",
          bulletStyle: "square",
          density: "spacious",
        },
      },
    };

    expect(getVisualLayout(spec)).toMatchObject({
      sidebarWidthPercent: 45,
      bodyFontSizePt: 12,
      nameFontSizePt: 12,
      colors: { text: "#334155", heading: "#112233" },
      marginsInches: { top: 1.25, right: 0.25 },
    });
    expect(partitionSections(spec)).toEqual({
      full: ["education"],
      main: ["experience"],
      sidebar: ["skills"],
    });
    expect(templateNeedsReanalysis(spec.template!)).toBe(false);
  });
});
