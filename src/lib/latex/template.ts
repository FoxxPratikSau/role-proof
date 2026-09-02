import type { ResumeSpec } from "@/types";
import {
  getSectionHeading,
  getVisualLayout,
  partitionSections,
  type CanonicalSection,
} from "../templates/presentation";

const escapeLatex = (text: string): string => {
  return text
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/[&]/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/[{}]/g, (match) => (match === "{" ? "\\{" : "\\}"))
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
};

const escapeLatexUrl = (url: string): string => {
  return url.replace(/%/g, "\\%").replace(/#/g, "\\#");
};

const formatLinkedinUrl = (handle: string): string => {
  // If it's already a full URL, use it; otherwise construct one
  if (handle.startsWith("http")) return escapeLatexUrl(handle);
  // If it looks like a handle (starts with /in/ or is just a username)
  const clean = handle.replace(/^\/+/, "").replace(/^in\//, "");
  return `https://linkedin.com/in/${clean}`;
};

export const generateLatexSource = (spec: ResumeSpec): string => {
  const lines: string[] = [];
  const fontScale = spec.layout?.fontScale ?? 1;
  const visual = getVisualLayout(spec);
  const bodyFontBase = spec.template?.visualLayout ? visual.bodyFontSizePt : 10;
  const bodyFontSize = (bodyFontBase * fontScale).toFixed(2);
  const bodyLineHeight = (bodyFontBase * 1.02 * fontScale).toFixed(2);
  const paper = visual.pageSize === "a4" ? "a4paper" : "letterpaper";
  const hex = (value: string) => value.slice(1).toUpperCase();
  // ─── Preamble ─────────────────────────────────────────────
  lines.push(`\\documentclass[10pt,${paper}]{article}`);
  lines.push("");
  lines.push("% ─── Encoding & Fonts ───");
  lines.push("\\usepackage[utf8]{inputenc}");
  lines.push("\\usepackage[T1]{fontenc}");
  lines.push("\\usepackage{libertine}");
  lines.push("\\usepackage{inconsolata}");
  if (visual.bodyFontFamily === "sans-serif") {
    lines.push("\\renewcommand{\\familydefault}{\\sfdefault}");
  }
  lines.push("");
  lines.push("% ─── Layout ───");
  lines.push(
    `\\usepackage[top=${visual.marginsInches.top}in,right=${visual.marginsInches.right}in,bottom=${visual.marginsInches.bottom}in,left=${visual.marginsInches.left}in]{geometry}`,
  );
  lines.push("\\usepackage{titlesec}");
  lines.push("\\usepackage{enumitem}");
  lines.push("\\usepackage{tabularx}");
  lines.push("\\usepackage{hyperref}");
  lines.push("\\usepackage{xcolor}");
  lines.push("");
  lines.push("% ─── Colors ───");
  lines.push(`\\definecolor{headline}{HTML}{${hex(visual.colors.heading)}}`);
  lines.push(`\\definecolor{bodytext}{HTML}{${hex(visual.colors.text)}}`);
  lines.push(`\\definecolor{accent}{HTML}{${hex(visual.colors.accent)}}`);
  lines.push(`\\definecolor{ruledark}{HTML}{${hex(visual.colors.divider)}}`);
  lines.push("");
  lines.push("% ─── Spacing ───");
  lines.push("\\setlength{\\parindent}{0pt}");
  lines.push("\\setlength{\\parskip}{0pt}");
  lines.push("\\setlength{\\topskip}{0pt}");
  lines.push("\\setlength{\\parsep}{0pt}");
  lines.push("\\renewcommand{\\baselinestretch}{1.02}");
  lines.push("");
  lines.push("% ─── Section Formatting ───");
  lines.push("\\titleformat{\\section}");
  lines.push(
    `  {\\fontsize{${visual.sectionHeadingFontSizePt}pt}{${(visual.sectionHeadingFontSizePt * 1.1).toFixed(2)}pt}\\selectfont\\bfseries\\color{headline}}`,
  );
  lines.push("  {}");
  lines.push("  {0em}");
  lines.push("  {}");
  lines.push(
    visual.dividerStyle === "line"
      ? "  [\\vspace{-4pt}\\textcolor{ruledark}{\\rule{\\textwidth}{0.4pt}}\\vspace{2pt}]"
      : "  []",
  );
  lines.push("\\titlespacing*{\\section}{0pt}{10pt}{6pt}");
  lines.push("");
  lines.push("% ─── List Formatting ───");
  lines.push("\\setlist{");
  lines.push("  nosep,");
  lines.push("  leftmargin=1.4em,");
  lines.push("  itemsep=0pt,");
  lines.push("  parsep=0pt,");
  lines.push("  topsep=1pt,");
  lines.push("  partopsep=0pt,");
  const bulletLabel = {
    disc: "\\textbullet",
    dash: "--",
    square: "\\rule{0.45em}{0.45em}",
    none: "",
  }[visual.bulletStyle];
  lines.push(`  label=\\textcolor{accent}{${bulletLabel}}`);
  lines.push("}");
  lines.push("");
  lines.push("% ─── Hyperlinks ───");
  lines.push("\\hypersetup{");
  lines.push("  colorlinks=true,");
  lines.push("  linkcolor=headline,");
  lines.push("  urlcolor=accent,");
  lines.push("  pdfborder={0 0 0},");
  lines.push("}");
  lines.push("");
  lines.push("\\begin{document}");
  lines.push(`\\fontsize{${bodyFontSize}pt}{${bodyLineHeight}pt}\\selectfont`);
  lines.push("");
  // ─── Header / Contact ────────────────────────────────────
  const { meta } = spec;
  lines.push("% ─── Header ───");
  const headerEnvironment = {
    left: "flushleft",
    center: "center",
    right: "flushright",
  }[visual.headerAlignment];
  lines.push(`\\begin{${headerEnvironment}}`);
  lines.push(
    `  {\\fontsize{${visual.nameFontSizePt}pt}{${(visual.nameFontSizePt * 1.1).toFixed(2)}pt}\\selectfont\\bfseries\\color{headline}${escapeLatex(meta.name)}\\par}`,
  );
  lines.push("  \\vspace{3pt}");
  // Build contact line
  const contactItems: string[] = [];
  if (meta.email) {
    contactItems.push(
      `\\href{mailto:${escapeLatexUrl(meta.email)}}{\\texttt{${escapeLatex(meta.email)}}}`,
    );
  }
  if (meta.phone) {
    contactItems.push(`\\texttt{${escapeLatex(meta.phone)}}`);
  }
  if (meta.linkedin) {
    const linkedinUrl = formatLinkedinUrl(meta.linkedin);
    const displayHandle = meta.linkedin.replace(
      /^https?:\/\/(www\.)?linkedin\.com\/in\//,
      "",
    );
    contactItems.push(
      `\\href{${linkedinUrl}}{\\texttt{linkedin.com/in/${escapeLatex(displayHandle)}}}`,
    );
  }
  if (meta.github) {
    const handle = meta.github
      .replace(/^https?:\/\/(www\.)?github\.com\//, "")
      .replace(/\/$/, "");
    contactItems.push(
      `\\href{https://github.com/${escapeLatexUrl(handle)}}{\\texttt{github.com/${escapeLatex(handle)}}}`,
    );
  }
  if (meta.twitter) {
    const handle = meta.twitter
      .replace(/^https?:\/\/(www\.)?(twitter|x)\.com\//, "")
      .replace(/^@/, "")
      .replace(/\/$/, "");
    contactItems.push(
      `\\href{https://x.com/${escapeLatexUrl(handle)}}{\\texttt{x.com/${escapeLatex(handle)}}}`,
    );
  }
  if (meta.portfolio) {
    const portfolioDisplay = meta.portfolio.replace(/^https?:\/\//, "");
    contactItems.push(
      `\\href{${escapeLatexUrl(meta.portfolio)}}{\\texttt{${escapeLatex(portfolioDisplay)}}}`,
    );
  }
  if (contactItems.length > 0) {
    lines.push(
      `  {\\small\\color{bodytext}${contactItems.join(" \\,$\\vert$\\, ")}\\par}`,
    );
  }
  if (meta.targetRole) {
    lines.push(
      `  \\vspace{1pt}{\\small\\color{accent}\\textit{${escapeLatex(meta.targetRole)}}\\par}`,
    );
  }
  lines.push(`\\end{${headerEnvironment}}`);
  lines.push("");
  const renderSection = (target: string[], section: CanonicalSection) => {
    const heading = escapeLatex(getSectionHeading(spec.template, section));
    const openSection = () => {
      target.push(`% ─── ${heading} ───`);
      target.push(`\\section{${heading}}`);
    };
    if (section === "summary" && spec.summary.text) {
      openSection();
      target.push(
        `{\\color{bodytext}${escapeLatex(spec.summary.text)}\\par}`,
        "",
      );
    } else if (section === "experience" && spec.experience.length > 0) {
      openSection();
      for (const experience of spec.experience) {
        target.push("\\vspace{2pt}");
        target.push(
          `{\\bfseries\\color{headline}${escapeLatex(experience.role)}${
            experience.company
              ? ` \\textnormal{\\color{accent}\\normalfont|\\ }${escapeLatex(experience.company)}`
              : ""
          }\\hfill{\\small\\color{accent}\\normalfont${escapeLatex(experience.dates)}}\\par}`,
        );
        if (experience.bullets.length > 0) {
          target.push("\\begin{itemize}");
          for (const bulletText of experience.bullets) {
            target.push(
              `  \\item {\\color{bodytext}${escapeLatex(bulletText)}\\par}`,
            );
          }
          target.push("\\end{itemize}");
        }
      }
      target.push("");
    } else if (section === "projects" && spec.projects.length > 0) {
      openSection();
      for (const project of spec.projects) {
        target.push(
          "\\vspace{2pt}",
          `{\\bfseries\\color{headline}${escapeLatex(project.name)}\\par}`,
        );
        if (project.bullets.length > 0) {
          target.push("\\begin{itemize}");
          for (const bulletText of project.bullets) {
            target.push(
              `  \\item {\\color{bodytext}${escapeLatex(bulletText)}\\par}`,
            );
          }
          target.push("\\end{itemize}");
        }
      }
      target.push("");
    } else if (section === "skills" && spec.skills.categories.length > 0) {
      openSection();
      for (const category of spec.skills.categories) {
        target.push(
          `{\\bfseries\\color{headline}${escapeLatex(category.name)}:} {\\color{bodytext}${escapeLatex(category.items.join(", "))}\\par}`,
        );
      }
      target.push("");
    } else if (section === "education" && spec.education.length > 0) {
      openSection();
      for (const education of spec.education) {
        const degreeField = [education.degree, education.field]
          .filter(Boolean)
          .join(" in ");
        const leftSide = [
          degreeField ? `\\textbf{${escapeLatex(degreeField)}}` : "",
          education.institution ? escapeLatex(education.institution) : "",
        ]
          .filter(Boolean)
          .join(", ");
        target.push(
          `{\\color{bodytext}${leftSide}\\hfill{\\small\\color{accent}${escapeLatex(education.year)}}\\par}`,
        );
      }
      target.push("");
    } else if (section === "optional" && spec.optionalSections?.length) {
      for (const optionalSection of spec.optionalSections) {
        target.push(`\\section{${escapeLatex(optionalSection.heading)}}`);
        if (optionalSection.items.length > 0) {
          target.push("\\begin{itemize}");
          for (const item of optionalSection.items) {
            target.push(
              `  \\item {\\color{bodytext}${escapeLatex(item)}\\par}`,
            );
          }
          target.push("\\end{itemize}");
        }
      }
      target.push("");
    }
  };
  const groups = partitionSections(spec);
  for (const section of groups.full) renderSection(lines, section);
  if (visual.columns === 2) {
    const leftSections =
      visual.sidebarPosition === "left" ? groups.sidebar : groups.main;
    const rightSections =
      visual.sidebarPosition === "left" ? groups.main : groups.sidebar;
    const sidebarFraction = visual.sidebarWidthPercent / 100;
    const leftFraction =
      visual.sidebarPosition === "left" ? sidebarFraction : 1 - sidebarFraction;
    const rightFraction = 1 - leftFraction;
    lines.push(
      `\\begin{minipage}[t]{${(leftFraction - 0.02).toFixed(2)}\\textwidth}`,
    );
    for (const section of leftSections) renderSection(lines, section);
    lines.push("\\end{minipage}\\hfill");
    lines.push(
      `\\begin{minipage}[t]{${(rightFraction - 0.02).toFixed(2)}\\textwidth}`,
    );
    for (const section of rightSections) renderSection(lines, section);
    lines.push("\\end{minipage}");
  }
  // ─── End Document ────────────────────────────────────────
  lines.push("\\end{document}");
  return lines.join("\n");
};
