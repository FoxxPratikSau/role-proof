import type { ResumeSpec } from "@/types";
import { renderResumeHtml } from "./render";
import { measureAtWidth, measureHtmlPageFit } from "./measure";
import type { PageFitResult } from "./measure";

export interface ShrinkResult {
  spec: ResumeSpec;
  fit: PageFitResult;
  level: number;
}

type ShrinkFn = (spec: ResumeSpec) => ResumeSpec;

const SHRINK_LEVELS: ShrinkFn[] = [
  // Level 1: Slight font reduction (95%)
  (spec) => spec,

  // Level 2: Reduce font to 90%
  (spec) => spec,

  // Level 3: Reduce to 85% + remove optional sections
  (spec) => ({
    ...spec,
    optionalSections: [],
  }),

  // Level 4: Cap experience bullets at 3, projects at 2
  (spec) => ({
    ...spec,
    optionalSections: [],
    experience: spec.experience.map((e) => ({
      ...e,
      bullets: e.bullets.slice(0, 3),
    })),
    projects: spec.projects.map((p) => ({
      ...p,
      bullets: p.bullets.slice(0, 2),
    })),
  }),

  // Level 5: Cap bullets at 2, merge all skills into one line
  (spec) => {
    const allSkills = spec.skills.categories.flatMap((c) => c.items);
    return {
      ...spec,
      optionalSections: [],
      experience: spec.experience.map((e) => ({
        ...e,
        bullets: e.bullets.slice(0, 2),
      })),
      projects: spec.projects.map((p) => ({
        ...p,
        bullets: p.bullets.slice(0, 1),
      })),
      skills: {
        categories: [{ name: "Skills", items: allSkills }],
      },
    };
  },
];

/** Font scaling factors per shrink level. Each maps to the same-index entry in SHRINK_LEVELS. */
const FONT_SCALES: readonly [number, number, number, number, number] = [
  1, 0.95, 0.9, 0.85, 0.8,
];

const createCandidate = (spec: ResumeSpec, level: number): ResumeSpec => {
  const candidate = SHRINK_LEVELS[level](spec);
  return {
    ...candidate,
    layout: {
      fontScale: FONT_SCALES[level],
      shrinkLevel: level,
    },
  };
};

const measureSpec = (
  html: string,
  spec: ResumeSpec,
): Promise<PageFitResult> => {
  return spec.template?.visualLayout?.pageSize === "a4"
    ? measureAtWidth(html, 8.27, 11.69)
    : measureHtmlPageFit(html);
};

/**
 * Progressively shrink a ResumeSpec until its rendered HTML fits on 1 letter page.
 * Returns the spec at the first shrink level that fits, or the most-shrunk version.
 */
export const shrinkSpecToFit = async (
  spec: ResumeSpec,
): Promise<ShrinkResult> => {
  for (let level = 0; level < SHRINK_LEVELS.length; level++) {
    const shrunkSpec = createCandidate(spec, level);
    const html = renderResumeHtml(shrunkSpec);
    try {
      const fit = await measureSpec(html, shrunkSpec);
      if (fit.fits) {
        return { spec: shrunkSpec, fit, level };
      }
    } catch {
      // measurement failed; try next level
    }
  }
  // Nothing fits — return last level with measurement
  const lastSpec = createCandidate(spec, SHRINK_LEVELS.length - 1);
  const html = renderResumeHtml(lastSpec);
  let fit: PageFitResult;
  try {
    fit = await measureSpec(html, lastSpec);
  } catch {
    fit = {
      fits: false,
      scrollHeight: 0,
      pageHeight: 1056,
      overflowPx: 0,
      estPages: 1,
    };
  }
  return { spec: lastSpec, fit, level: SHRINK_LEVELS.length - 1 };
};
