import type {
  ResumeCritique,
  ResumeSpec,
  TemplateSpecification,
} from "@/types";

export type CanonicalSection =
  | "summary"
  | "skills"
  | "experience"
  | "projects"
  | "education"
  | "optional";

export interface NormalizedVisualLayout {
  pageSize: "letter" | "a4";
  columns: 1 | 2;
  sidebarPosition: "left" | "right";
  sidebarWidthPercent: number;
  sectionColumns: Record<string, "main" | "sidebar" | "full">;
  headerAlignment: "left" | "center" | "right";
  bodyFontFamily: "serif" | "sans-serif" | "monospace";
  headingFontFamily: "serif" | "sans-serif" | "monospace";
  bodyFontSizePt: number;
  nameFontSizePt: number;
  sectionHeadingFontSizePt: number;
  marginsInches: { top: number; right: number; bottom: number; left: number };
  colors: { text: string; heading: string; accent: string; divider: string };
  sectionHeadingCase: "uppercase" | "title" | "preserve";
  dividerStyle: "none" | "line";
  bulletStyle: "disc" | "dash" | "square" | "none";
  density: "compact" | "balanced" | "spacious";
}

const DEFAULT_ORDER: CanonicalSection[] = [
  "summary",
  "experience",
  "projects",
  "skills",
  "education",
  "optional",
];

const SECTION_SET = new Set<CanonicalSection>(DEFAULT_ORDER);

export const templateNeedsReanalysis = (
  template: TemplateSpecification,
): boolean => {
  return !template.visualLayout;
};

const SECTION_TERMS: Record<CanonicalSection, RegExp> = {
  summary: /\b(summary|professional profile|career profile|objective)\b/i,
  skills: /\b(skills?|technical toolkit|competencies|capabilities)\b/i,
  experience: /\b(experience|employment|work history)\b/i,
  projects: /\b(projects?|portfolio projects?)\b/i,
  education: /\b(education|academic|degree)\b/i,
  optional: /\b(optional section)\b/i,
};

/** Remove model suggestions that violate the selected template's section allowlist. */
export const enforceTemplateCritique = (
  critique: ResumeCritique,
  template: TemplateSpecification,
): ResumeCritique => {
  const allowed = new Set(template.sectionOrder);
  const excludedPatterns = DEFAULT_ORDER.filter(
    (section) => !allowed.has(section),
  ).map((section) => SECTION_TERMS[section]);
  const keep = (value: string) =>
    !excludedPatterns.some((pattern) => pattern.test(value));
  const filter = (values: string[] | undefined) => values?.filter(keep);
  return {
    ...critique,
    weaknesses: critique.weaknesses.filter(keep),
    suggestions: critique.suggestions.filter(keep),
    categorizedSuggestions: critique.categorizedSuggestions
      ? {
          fabrication: critique.categorizedSuggestions.fabrication.filter(keep),
          content: critique.categorizedSuggestions.content.filter(keep),
          impact: critique.categorizedSuggestions.impact.filter(keep),
          ats: critique.categorizedSuggestions.ats.filter(keep),
          clarity: critique.categorizedSuggestions.clarity.filter(keep),
        }
      : undefined,
    previousWeaknessesAddressed: filter(critique.previousWeaknessesAddressed),
    newWeaknesses: critique.newWeaknesses.filter(keep),
    recurringWeaknesses: filter(critique.recurringWeaknesses),
  };
};

const DEFAULT_LAYOUT: NormalizedVisualLayout = {
  pageSize: "letter",
  columns: 1,
  sidebarPosition: "left",
  sidebarWidthPercent: 32,
  sectionColumns: {},
  headerAlignment: "center",
  bodyFontFamily: "serif",
  headingFontFamily: "serif",
  bodyFontSizePt: 8.5,
  nameFontSizePt: 16,
  sectionHeadingFontSizePt: 9,
  marginsInches: { top: 0.47, right: 0.5, bottom: 0.42, left: 0.5 },
  colors: {
    text: "#334155",
    heading: "#1e293b",
    accent: "#475569",
    divider: "#94a3b8",
  },
  sectionHeadingCase: "uppercase",
  dividerStyle: "line",
  bulletStyle: "disc",
  density: "compact",
};

const clampNumber = (
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) => {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : fallback;
};

const enumValue = <T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T => {
  return typeof value === "string" && allowed.includes(value as T)
    ? (value as T)
    : fallback;
};

const color = (value: unknown, fallback: string): string => {
  return typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value)
    ? value.toLowerCase()
    : fallback;
};

export const getSectionOrder = (spec: ResumeSpec): CanonicalSection[] => {
  if (!spec.template) return DEFAULT_ORDER;
  return spec.template.sectionOrder.filter(
    (section, index, sections): section is CanonicalSection =>
      SECTION_SET.has(section as CanonicalSection) &&
      sections.indexOf(section) === index,
  );
};

export const getSectionHeading = (
  template: TemplateSpecification | undefined,
  section: CanonicalSection,
): string => {
  const fallback = section.charAt(0).toUpperCase() + section.slice(1);
  const value = template?.sectionHeadings[section];
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
};

export const getVisualLayout = (spec: ResumeSpec): NormalizedVisualLayout => {
  const value = spec.template?.visualLayout;
  if (!value) return DEFAULT_LAYOUT;
  const columns = value.columns === 2 ? 2 : 1;
  const sectionColumns = Object.fromEntries(
    Object.entries(value.sectionColumns ?? {}).filter(([, column]) =>
      ["main", "sidebar", "full"].includes(column),
    ),
  );
  return {
    pageSize: value.pageSize === "a4" ? "a4" : "letter",
    columns,
    sidebarPosition: value.sidebarPosition === "right" ? "right" : "left",
    sidebarWidthPercent: clampNumber(value.sidebarWidthPercent, 32, 20, 45),
    sectionColumns,
    headerAlignment: enumValue(
      value.headerAlignment,
      ["left", "center", "right"],
      DEFAULT_LAYOUT.headerAlignment,
    ),
    bodyFontFamily: enumValue(
      value.bodyFontFamily,
      ["serif", "sans-serif", "monospace"],
      DEFAULT_LAYOUT.bodyFontFamily,
    ),
    headingFontFamily: enumValue(
      value.headingFontFamily,
      ["serif", "sans-serif", "monospace"],
      DEFAULT_LAYOUT.headingFontFamily,
    ),
    bodyFontSizePt: clampNumber(value.bodyFontSizePt, 8.5, 7, 12),
    nameFontSizePt: clampNumber(value.nameFontSizePt, 16, 12, 30),
    sectionHeadingFontSizePt: clampNumber(
      value.sectionHeadingFontSizePt,
      9,
      7,
      16,
    ),
    marginsInches: {
      top: clampNumber(value.marginsInches?.top, 0.47, 0.25, 1.25),
      right: clampNumber(value.marginsInches?.right, 0.5, 0.25, 1.25),
      bottom: clampNumber(value.marginsInches?.bottom, 0.42, 0.25, 1.25),
      left: clampNumber(value.marginsInches?.left, 0.5, 0.25, 1.25),
    },
    colors: {
      text: color(value.colors?.text, DEFAULT_LAYOUT.colors.text),
      heading: color(value.colors?.heading, DEFAULT_LAYOUT.colors.heading),
      accent: color(value.colors?.accent, DEFAULT_LAYOUT.colors.accent),
      divider: color(value.colors?.divider, DEFAULT_LAYOUT.colors.divider),
    },
    sectionHeadingCase: enumValue(
      value.sectionHeadingCase,
      ["uppercase", "title", "preserve"],
      DEFAULT_LAYOUT.sectionHeadingCase,
    ),
    dividerStyle: value.dividerStyle === "none" ? "none" : "line",
    bulletStyle: enumValue(
      value.bulletStyle,
      ["disc", "dash", "square", "none"],
      DEFAULT_LAYOUT.bulletStyle,
    ),
    density: enumValue(
      value.density,
      ["compact", "balanced", "spacious"],
      DEFAULT_LAYOUT.density,
    ),
  };
};

export const partitionSections = (
  spec: ResumeSpec,
): {
  full: CanonicalSection[];
  main: CanonicalSection[];
  sidebar: CanonicalSection[];
} => {
  const order = getSectionOrder(spec);
  const layout = getVisualLayout(spec);
  if (layout.columns === 1) return { full: order, main: [], sidebar: [] };
  return order.reduce(
    (result, section) => {
      const column = layout.sectionColumns[section] ?? "main";
      result[column].push(section);
      return result;
    },
    {
      full: [] as CanonicalSection[],
      main: [] as CanonicalSection[],
      sidebar: [] as CanonicalSection[],
    },
  );
};
