import type { ResumeSpec } from "@/types";
import {
  getSectionHeading,
  getSectionOrder,
  getVisualLayout,
  partitionSections,
  type CanonicalSection,
} from "../templates/presentation";

const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
};

export const renderResumeHtml = (spec: ResumeSpec): string => {
  const { meta } = spec;
  const fontScale = spec.layout?.fontScale ?? 1;
  const scaledLineHeight = 1.08 + fontScale * 0.1;
  const visual = getVisualLayout(spec);
  const pageWidth = visual.pageSize === "a4" ? "8.27in" : "8.5in";
  const pageSize = visual.pageSize === "a4" ? "A4" : "letter";
  const bodyFont = {
    serif: "'Libre Baskerville', 'Times New Roman', serif",
    "sans-serif": "'Inter', Arial, sans-serif",
    monospace: "'Courier New', monospace",
  }[visual.bodyFontFamily];
  const headingFont = {
    serif: "'Libre Baskerville', 'Times New Roman', serif",
    "sans-serif": "'Inter', Arial, sans-serif",
    monospace: "'Courier New', monospace",
  }[visual.headingFontFamily];
  const sectionGap = { compact: 4, balanced: 7, spacious: 11 }[visual.density];
  const bullet = {
    disc: "•",
    dash: "-",
    square: "■",
    none: "",
  }[visual.bulletStyle];
  const parts: string[] = [];
  // Document shell + print styles
  parts.push(`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Inter:wght@400;500;600&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: ${bodyFont};
    font-size: ${visual.bodyFontSizePt}pt;
    line-height: 1.18;
    color: ${visual.colors.text};
    background: white;
    max-width: ${pageWidth};
    margin: 0 auto;
    padding: ${visual.marginsInches.top}in ${visual.marginsInches.right}in ${visual.marginsInches.bottom}in ${visual.marginsInches.left}in;
  }

  /* ─── Print / PDF ─── */
  @page {
    size: ${pageSize};
    margin: 0;
  }
  @media print {
    body {
      padding: ${visual.marginsInches.top}in ${visual.marginsInches.right}in ${visual.marginsInches.bottom}in ${visual.marginsInches.left}in;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }

  /* ─── Header ─── */
  .header {
    text-align: ${visual.headerAlignment};
    margin-bottom: 10pt;
  }
  .header .name {
    font-family: ${headingFont};
    font-size: ${visual.nameFontSizePt}pt;
    font-weight: 700;
    color: ${visual.colors.heading};
    letter-spacing: 0.3pt;
    margin-bottom: 1pt;
  }
  .header .contact {
    font-size: 7.5pt;
    color: ${visual.colors.accent};
    font-family: 'Inter', sans-serif;
  }
  .header .contact a {
    color: ${visual.colors.accent};
    text-decoration: none;
  }
  .header .contact span.sep {
    margin: 0 3pt;
    color: ${visual.colors.divider};
  }
  .header .role {
    font-size: 7.5pt;
    color: ${visual.colors.accent};
    font-style: italic;
    margin-top: 1pt;
    font-family: 'Inter', sans-serif;
  }

  /* ─── Sections ─── */
  .section {
    margin-bottom: ${sectionGap}pt;
    break-inside: avoid;
  }
  .section-heading {
    font-family: ${headingFont};
    font-size: ${visual.sectionHeadingFontSizePt}pt;
    font-weight: 700;
    color: ${visual.colors.heading};
    letter-spacing: 0.4pt;
    text-transform: ${visual.sectionHeadingCase === "uppercase" ? "uppercase" : "none"};
    border-bottom: ${visual.dividerStyle === "line" ? `0.4pt solid ${visual.colors.divider}` : "none"};
    padding-bottom: 1pt;
    margin-bottom: 3pt;
  }

  /* ─── Summary ─── */
  .summary-text {
    color: ${visual.colors.text};
    line-height: 1.2;
  }

  /* ─── Experience ─── */
  .exp-entry {
    margin-bottom: 3pt;
  }
  .exp-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 0.5pt;
  }
  .exp-role {
    font-weight: 700;
    color: ${visual.colors.heading};
    font-size: 8.5pt;
  }
  .exp-company {
    font-weight: 400;
    color: ${visual.colors.accent};
    font-size: 8pt;
  }
  .exp-dates {
    font-size: 7.5pt;
    color: ${visual.colors.accent};
    font-family: 'Inter', sans-serif;
    white-space: nowrap;
  }
  .exp-bullets {
    list-style: none;
    padding-left: 0;
  }
  .exp-bullets li {
    position: relative;
    padding-left: 9pt;
    margin-bottom: 0pt;
    color: ${visual.colors.text};
    font-size: 8.5pt;
    line-height: 1.18;
  }
  .exp-bullets li::before {
    content: "${bullet}";
    position: absolute;
    left: 1pt;
    color: ${visual.colors.accent};
    font-size: 7pt;
  }

  /* ─── Projects ─── */
  .proj-entry {
    margin-bottom: 3pt;
  }
  .proj-name {
    font-weight: 700;
    color: ${visual.colors.heading};
    font-size: 8.5pt;
    margin-bottom: 0.5pt;
  }
  .proj-bullets {
    list-style: none;
    padding-left: 0;
  }
  .proj-bullets li {
    position: relative;
    padding-left: 9pt;
    margin-bottom: 0pt;
    color: ${visual.colors.text};
    font-size: 8.5pt;
    line-height: 1.18;
  }
  .proj-bullets li::before {
    content: "${bullet}";
    position: absolute;
    left: 1pt;
    color: ${visual.colors.accent};
    font-size: 7pt;
  }

  /* ─── Skills ─── */
  .skills-line {
    margin-bottom: 0.5pt;
    font-size: 8.5pt;
  }
  .skills-cat {
    font-weight: 700;
    color: ${visual.colors.heading};
  }
  .skills-items {
    color: ${visual.colors.text};
  }

  /* ─── Education ─── */
  .edu-entry {
    display: flex;
    justify-content: space-between;
    margin-bottom: 0.5pt;
    font-size: 8.5pt;
    color: ${visual.colors.text};
  }
  .edu-details {
    font-weight: 600;
  }
  .edu-year {
    color: ${visual.colors.accent};
    font-family: 'Inter', sans-serif;
    font-size: 7.5pt;
  }

  /* ─── Optional Sections ─── */
  .opt-bullets {
    list-style: none;
    padding-left: 0;
  }
  .opt-bullets li {
    position: relative;
    padding-left: 9pt;
    margin-bottom: 0pt;
    color: ${visual.colors.text};
    font-size: 8.5pt;
    line-height: 1.18;
  }
  .opt-bullets li::before {
    content: "${bullet}";
    position: absolute;
    left: 1pt;
    color: ${visual.colors.accent};
    font-size: 7pt;
  }
  :root { --roleproof-font-scale: ${fontScale}; }
  body { font-size: calc(var(--roleproof-font-scale) * ${visual.bodyFontSizePt}pt); }
  .exp-bullets li, .proj-bullets li, .opt-bullets li {
    font-size: calc(var(--roleproof-font-scale) * ${visual.bodyFontSizePt}pt);
    line-height: ${scaledLineHeight};
  }
  .section-heading { font-size: calc(var(--roleproof-font-scale) * ${visual.sectionHeadingFontSizePt}pt); }
  .exp-role, .proj-name { font-size: calc(var(--roleproof-font-scale) * ${visual.bodyFontSizePt}pt); }
  .resume-columns { display: grid; gap: 14pt; align-items: start; }
  .resume-columns.sidebar-left { grid-template-columns: minmax(0, ${visual.sidebarWidthPercent}fr) minmax(0, ${100 - visual.sidebarWidthPercent}fr); }
  .resume-columns.sidebar-right { grid-template-columns: minmax(0, ${100 - visual.sidebarWidthPercent}fr) minmax(0, ${visual.sidebarWidthPercent}fr); }
</style>
</head>
<body>
`);
  // ─── Header ───
  parts.push('<div class="header">');
  parts.push(`<div class="name">${escapeHtml(meta.name)}</div>`);
  const contactItems: string[] = [];
  if (meta.email) {
    contactItems.push(
      `<a href="mailto:${escapeHtml(meta.email)}">${escapeHtml(meta.email)}</a>`,
    );
  }
  if (meta.phone) {
    contactItems.push(escapeHtml(meta.phone));
  }
  if (meta.location) {
    contactItems.push(escapeHtml(meta.location));
  }
  if (meta.linkedin) {
    const handle = meta.linkedin
      .replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, "")
      .replace(/\/$/, "");
    contactItems.push(
      `<a href="https://linkedin.com/in/${escapeHtml(handle)}" target="_blank">linkedin.com/in/${escapeHtml(handle)}</a>`,
    );
  }
  if (meta.github) {
    const handle = meta.github
      .replace(/^https?:\/\/(www\.)?github\.com\//, "")
      .replace(/\/$/, "");
    contactItems.push(
      `<a href="https://github.com/${escapeHtml(handle)}" target="_blank">github.com/${escapeHtml(handle)}</a>`,
    );
  }
  if (meta.twitter) {
    const handle = meta.twitter
      .replace(/^https?:\/\/(www\.)?(twitter|x)\.com\//, "")
      .replace(/^@/, "")
      .replace(/\/$/, "");
    contactItems.push(
      `<a href="https://x.com/${escapeHtml(handle)}" target="_blank">x.com/${escapeHtml(handle)}</a>`,
    );
  }
  if (meta.portfolio) {
    const display = meta.portfolio
      .replace(/^https?:\/\//, "")
      .replace(/\/$/, "");
    contactItems.push(
      `<a href="${escapeHtml(meta.portfolio)}" target="_blank">${escapeHtml(display)}</a>`,
    );
  }
  if (contactItems.length > 0) {
    parts.push(
      `<div class="contact">${contactItems.join('<span class="sep">|</span>')}</div>`,
    );
  }
  if (meta.targetRole) {
    parts.push(`<div class="role">${escapeHtml(meta.targetRole)}</div>`);
  }
  parts.push("</div>");
  const formatHeading = (section: CanonicalSection) => {
    const heading = getSectionHeading(spec.template, section);
    if (visual.sectionHeadingCase !== "title") return heading;
    return heading
      .toLowerCase()
      .replace(/\b\w/g, (character) => character.toUpperCase());
  };
  const renderSection = (section: CanonicalSection): string[] => {
    const sectionParts: string[] = [];
    const openSection = () => {
      sectionParts.push('<div class="section">');
      sectionParts.push(
        `<div class="section-heading">${escapeHtml(formatHeading(section))}</div>`,
      );
    };
    if (section === "summary" && spec.summary.text) {
      openSection();
      sectionParts.push(
        `<p class="summary-text">${escapeHtml(spec.summary.text)}</p>`,
      );
      sectionParts.push("</div>");
    } else if (section === "experience" && spec.experience.length > 0) {
      openSection();
      for (const exp of spec.experience) {
        sectionParts.push('<div class="exp-entry"><div class="exp-header">');
        sectionParts.push(
          `<span><span class="exp-role">${escapeHtml(exp.role)}</span>` +
            (exp.company
              ? ` <span class="exp-company">| ${escapeHtml(exp.company)}</span>`
              : "") +
            `</span><span class="exp-dates">${escapeHtml(exp.dates)}</span></div>`,
        );
        if (exp.bullets.length > 0) {
          sectionParts.push('<ul class="exp-bullets">');
          for (const bulletText of exp.bullets) {
            sectionParts.push(`<li>${escapeHtml(bulletText)}</li>`);
          }
          sectionParts.push("</ul>");
        }
        sectionParts.push("</div>");
      }
      sectionParts.push("</div>");
    } else if (section === "projects" && spec.projects.length > 0) {
      openSection();
      for (const project of spec.projects) {
        sectionParts.push('<div class="proj-entry">');
        sectionParts.push(
          `<div class="proj-name">${escapeHtml(project.name)}</div>`,
        );
        if (project.bullets.length > 0) {
          sectionParts.push('<ul class="proj-bullets">');
          for (const bulletText of project.bullets) {
            sectionParts.push(`<li>${escapeHtml(bulletText)}</li>`);
          }
          sectionParts.push("</ul>");
        }
        sectionParts.push("</div>");
      }
      sectionParts.push("</div>");
    } else if (section === "skills" && spec.skills.categories.length > 0) {
      openSection();
      for (const category of spec.skills.categories) {
        sectionParts.push(
          `<div class="skills-line"><span class="skills-cat">${escapeHtml(category.name)}:</span> <span class="skills-items">${escapeHtml(category.items.join(", "))}</span></div>`,
        );
      }
      sectionParts.push("</div>");
    } else if (section === "education" && spec.education.length > 0) {
      openSection();
      for (const education of spec.education) {
        const degreeField = [education.degree, education.field]
          .filter(Boolean)
          .join(" in ");
        const left = [degreeField, education.institution]
          .filter(Boolean)
          .join(", ");
        sectionParts.push(
          `<div class="edu-entry"><span class="edu-details">${escapeHtml(left)}</span><span class="edu-year">${escapeHtml(education.year)}</span></div>`,
        );
      }
      sectionParts.push("</div>");
    } else if (section === "optional" && spec.optionalSections?.length) {
      for (const optionalSection of spec.optionalSections) {
        sectionParts.push('<div class="section">');
        sectionParts.push(
          `<div class="section-heading">${escapeHtml(optionalSection.heading)}</div>`,
        );
        if (optionalSection.items.length > 0) {
          sectionParts.push('<ul class="opt-bullets">');
          for (const item of optionalSection.items) {
            sectionParts.push(`<li>${escapeHtml(item)}</li>`);
          }
          sectionParts.push("</ul>");
        }
        sectionParts.push("</div>");
      }
    }
    return sectionParts;
  };
  const sectionGroups = partitionSections(spec);
  for (const section of sectionGroups.full)
    parts.push(...renderSection(section));
  if (visual.columns === 2) {
    parts.push(
      `<div class="resume-columns sidebar-${visual.sidebarPosition}">`,
    );
    const leftSections =
      visual.sidebarPosition === "left"
        ? sectionGroups.sidebar
        : sectionGroups.main;
    const rightSections =
      visual.sidebarPosition === "left"
        ? sectionGroups.main
        : sectionGroups.sidebar;
    parts.push("<div>");
    for (const section of leftSections) parts.push(...renderSection(section));
    parts.push("</div><div>");
    for (const section of rightSections) parts.push(...renderSection(section));
    parts.push("</div></div>");
  }
  parts.push("</body></html>");
  return parts.join("\n");
};
