import { describe, expect, it } from "vitest";
import type { ResumeSpec } from "@/types";
import type { ShrinkResult } from "./shrink";
import { buildFinalResumeArtifacts } from "./finalize";
import { renderResumeHtml } from "./render";

const fittedSpec: ResumeSpec = {
  layout: { fontScale: 0.8, shrinkLevel: 4 },
  meta: {
    name: "Ada Lovelace",
    email: "ada@example.com",
    phone: "+1 555 0100",
    targetRole: "Software Engineer",
  },
  summary: { text: "Builds reliable systems." },
  skills: { categories: [{ name: "Languages", items: ["TypeScript"] }] },
  experience: [
    {
      company: "Example Co",
      role: "Engineer",
      dates: "2024 - Present",
      bullets: ["Retained fitted bullet"],
      featured: true,
    },
  ],
  projects: [{ name: "RoleProof", bullets: ["Generated verified artifacts"] }],
  education: [
    {
      institution: "Example University",
      degree: "B.Tech.",
      field: "Computer Science",
      year: "2024",
    },
  ],
};

const shrinkResult: ShrinkResult = {
  spec: fittedSpec,
  level: 4,
  fit: {
    fits: true,
    scrollHeight: 900,
    pageHeight: 970,
    overflowPx: 0,
    estPages: 1,
  },
};

describe("buildFinalResumeArtifacts", () => {
  it("builds preview, LaTeX, and verification from the same fitted spec", async () => {
    const artifacts = buildFinalResumeArtifacts(shrinkResult);
    const previewHtml = await artifacts.latexHtmlBlob.text();

    expect(artifacts.resumeSpec).toBe(fittedSpec);
    expect(previewHtml).toBe(renderResumeHtml(fittedSpec));
    expect(previewHtml).toContain("--roleproof-font-scale: 0.8");
    expect(artifacts.latexSource).toContain(
      "\\fontsize{8.00pt}{8.16pt}\\selectfont",
    );
    expect(artifacts.latexSource).toContain("Retained fitted bullet");
    expect(artifacts.latexSource).toContain("$\\vert$");
    expect(artifacts.latexSource).not.toContain("\u000b");
    expect(artifacts.latexVerification).toMatchObject({
      passes: true,
      pageCount: 1,
    });
  });

  it("uses the selected template as an exact section and visual contract", async () => {
    const templatedSpec: ResumeSpec = {
      ...fittedSpec,
      template: {
        schemaVersion: 1,
        style: "left-aligned two-column reference",
        tone: "direct",
        sectionOrder: ["skills", "experience"],
        sectionHeadings: {
          skills: "Technical toolkit",
          experience: "Selected work",
        },
        contentRules: ["Omit summary"],
        formattingRules: ["Use a narrow left sidebar"],
        promptInstructions: "Match the reference hierarchy.",
        visualLayout: {
          pageSize: "a4",
          columns: 2,
          sidebarPosition: "left",
          sidebarWidthPercent: 30,
          sectionColumns: { skills: "sidebar", experience: "main" },
          headerAlignment: "left",
          bodyFontFamily: "sans-serif",
          headingFontFamily: "sans-serif",
          bodyFontSizePt: 9,
          nameFontSizePt: 20,
          sectionHeadingFontSizePt: 10,
          marginsInches: { top: 0.6, right: 0.7, bottom: 0.6, left: 0.7 },
          colors: {
            text: "#202020",
            heading: "#101010",
            accent: "#245678",
            divider: "#999999",
          },
          sectionHeadingCase: "title",
          dividerStyle: "none",
          bulletStyle: "dash",
          density: "balanced",
        },
      },
    };
    const artifacts = buildFinalResumeArtifacts({
      ...shrinkResult,
      spec: templatedSpec,
    });
    const html = await artifacts.latexHtmlBlob.text();

    expect(html).not.toContain(">Summary<");
    expect(html).not.toContain("Builds reliable systems.");
    expect(html).toContain(">Technical Toolkit<");
    expect(html).toContain(">Selected Work<");
    expect(html).toContain("size: A4");
    expect(html).toContain("text-align: left");
    expect(html).toContain('content: "-"');
    expect(html.indexOf("Technical Toolkit")).toBeLessThan(
      html.indexOf("Selected Work"),
    );

    expect(artifacts.latexSource).not.toContain("\\section{Summary}");
    expect(artifacts.latexSource).toContain("\\section{Technical toolkit}");
    expect(artifacts.latexSource).toContain("\\section{Selected work}");
    expect(artifacts.latexSource).toContain("a4paper");
    expect(artifacts.latexVerification.checks[1]).toMatchObject({
      name: "Section Completeness",
      passed: true,
    });
  });
});
