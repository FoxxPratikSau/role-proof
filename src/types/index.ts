// ─── AI Provider ────────────────────────────────────────────

export type Provider =
  | "deepseek"
  | "openai"
  | "anthropic"
  | "google"
  | "openrouter";

export interface ProviderConfig {
  baseUrl: string;
  chatEndpoint: string;
  headers: (apiKey: string) => Record<string, string>;
  models: ModelOption[];
  defaultModel: string;
}

interface ModelOption {
  value: string;
  label: string;
  desc: string;
}

// ─── Resume Data ────────────────────────────────────────────

export interface Experience {
  company: string;
  role: string;
  duration: string;
  highlights: string[];
}

export interface Education {
  institution: string;
  degree: string;
  field: string;
  year: string;
}

export interface Project {
  name: string;
  description: string;
  url?: string;
  technologies?: string[];
  duration?: string;
  highlights?: string[];
}

export interface OpenSource {
  name: string;
  description: string;
  url?: string;
  role?: string;
  technologies?: string[];
  highlights?: string[];
}

export interface OtherWork {
  title: string;
  type: string;
  description: string;
  url?: string;
  date?: string;
}

export interface MasterResume {
  name: string;
  email: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  twitter?: string;
  portfolio?: string;
  summary: string;
  skills: string[] | Record<string, string[]>;
  experience: Experience[];
  education: Education[];
  certifications?: string[];
  projects?: Project[];
  openSource?: OpenSource[];
  otherWorks?: OtherWork[];
  customSections?: Record<string, string[]>;
}

export interface TemplateSpecification {
  schemaVersion: 1;
  style: string;
  tone: string;
  sectionOrder: string[];
  sectionHeadings: Record<string, string>;
  contentRules: string[];
  formattingRules: string[];
  promptInstructions: string;
  visualLayout?: {
    pageSize: "letter" | "a4";
    columns: 1 | 2;
    sidebarPosition: "left" | "right" | null;
    sidebarWidthPercent: number | null;
    sectionColumns: Record<string, "main" | "sidebar" | "full">;
    headerAlignment: "left" | "center" | "right";
    bodyFontFamily: "serif" | "sans-serif" | "monospace";
    headingFontFamily: "serif" | "sans-serif" | "monospace";
    bodyFontSizePt: number;
    nameFontSizePt: number;
    sectionHeadingFontSizePt: number;
    marginsInches: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    colors: {
      text: string;
      heading: string;
      accent: string;
      divider: string;
    };
    sectionHeadingCase: "uppercase" | "title" | "preserve";
    dividerStyle: "none" | "line";
    bulletStyle: "disc" | "dash" | "square" | "none";
    density: "compact" | "balanced" | "spacious";
  };
}

export interface ResumeTemplate {
  id: string;
  slug: string | null;
  name: string;
  description: string;
  source_type: "curated" | "uploaded";
  source_filename: string | null;
  specification: TemplateSpecification;
  created_at: string;
  updated_at: string;
}

export interface MasterResumeRecord {
  id: string;
  title: string;
  content: MasterResume;
  selected_template_id: string | null;
  schema_version: number;
  version: number;
  created_at: string;
  updated_at: string;
}

// ─── AI Pipeline Types ─────────────────────────────────────

export type PipelineStep =
  | "jd-analysis"
  | "experience-mapping"
  | "resume-generation"
  | "resume-critique"
  | "resume-spec"
  | "latex-generation"
  | "latex-verification";

export interface JDAnalysis {
  roleTitle: string;
  companyName?: string;
  requiredSkills: string[];
  niceToHaveSkills: string[];
  keyResponsibilities: string[];
  experienceLevel: string;
  industryContext: string;
  keywords: string[];
  coreResponsibilities: string[];
  hiddenRequirements: string[];
  atsKeywords: string[];
}

export interface ExperienceMapping {
  matchedSkills: string[];
  missingSkills: string[];
  experienceGap: string | null;
  relevanceScore: number; // 0-100
  notes: string[];
  recommendedExperience: string[];
  recommendedProjects: string[];
  recommendedOpenSource: string[];
  sectionsToDownplay: string[];
}

export type CritiqueCategory =
  | "fabrication"
  | "content"
  | "impact"
  | "ats"
  | "clarity";

export interface CategorizedSuggestions {
  fabrication: string[];
  content: string[];
  impact: string[];
  ats: string[];
  clarity: string[];
}

export interface ResumeCritique {
  score: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  atsScore: number;
  isConverged: boolean;
  categorizedSuggestions?: CategorizedSuggestions;
  previousWeaknessesAddressed?: string[];
  newWeaknesses: string[];
  recurringWeaknesses?: string[];
}

export interface RevisionPlan {
  topSuggestions: string[];
  categories: CategorizedSuggestions;
  addressedFromPrevious: string[];
  unresolvedFromPrevious: string[];
}

export interface ConvergenceResult {
  isConverged: boolean;
  reason:
    | "llm_judgment"
    | "score_ceiling"
    | "score_delta"
    | "no_new_weaknesses"
    | "no_resume_change"
    | "stale_critique"
    | "max_iterations";
  scoreDelta: number | null;
  newWeaknesses: string[];
}

// ─── LaTeX / ResumeSpec Types ───────────────────────────────

export interface ResumeSpec {
  /** Deterministic layout adjustments selected by the one-page fitting pass. */
  layout?: {
    fontScale: number;
    shrinkLevel: number;
  };
  /** Selected reference-template rules carried into deterministic renderers. */
  template?: TemplateSpecification;
  meta: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    twitter?: string;
    portfolio?: string;
    targetRole: string;
  };
  summary: {
    text: string;
  };
  skills: {
    categories: Array<{
      name: string;
      items: string[];
    }>;
  };
  experience: Array<{
    company: string;
    role: string;
    dates: string;
    bullets: string[];
    featured: boolean;
  }>;
  projects: Array<{
    name: string;
    bullets: string[];
  }>;
  education: Array<{
    institution: string;
    degree: string;
    field: string;
    year: string;
  }>;
  optionalSections?: Array<{
    heading: string;
    items: string[];
  }>;
}

interface LatexVerificationCheck {
  name: string;
  passed: boolean;
  detail: string;
}

interface LatexVerificationIssue {
  severity: "error" | "warning";
  category:
    | "compilation"
    | "page_count"
    | "missing_section"
    | "font"
    | "overflow"
    | "formatting";
  message: string;
}

export interface LatexVerificationResult {
  passes: boolean;
  checks: LatexVerificationCheck[];
  issues: LatexVerificationIssue[];
  pageCount: number | null;
  fixAttempts: number;
}

// ─── Pipeline State ────────────────────────────────────────

export const TOKEN_BUDGETS: Record<PipelineStep, number> = {
  "jd-analysis": 2048,
  "experience-mapping": 2048,
  "resume-generation": 8192,
  "resume-critique": 6144,
  "resume-spec": 8192,
  "latex-generation": 0,
  "latex-verification": 0,
};
