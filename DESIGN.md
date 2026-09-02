---
version: alpha
name: "RoleProof"
description: "A focused candidate-dossier workspace for turning one career history into a role-specific resume."
colors:
  ink: "#172033"
  paper: "#F5F7FB"
  surface: "#FFFFFF"
  primary: "#3158D8"
  teal: "#138F83"
  amber: "#B87516"
  danger: "#C43D4B"
typography:
  sans:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
  display:
    fontFamily: "Manrope, ui-sans-serif, system-ui, sans-serif"
  mono:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
rounded:
  DEFAULT: "0.625rem"
  sm: "0.375rem"
  md: "0.625rem"
  lg: "0.875rem"
spacing:
  control: "2.5rem"
  panel: "1.25rem"
  page-max: "80rem"
components:
  button: {}
  card: {}
  input: {}
  navigation: {}
---

# RoleProof Design System

## Overview

### Creative North Star

RoleProof should feel like a well-prepared candidate dossier laid out beside a recruiter’s scorecard: calm, exact, and visibly connected. The interface is not a generic AI dashboard. Its signature is the alignment rail—a thin cobalt-to-teal line that connects evidence, decisions, and completed pipeline stages.

### Product context and register

- **Audience and primary job:** English-speaking knowledge workers tailoring an existing resume to a specific job description.
- **Target market and evidence:** Global and English-first; the current product copy, routes, and provider configuration contain no market-specific contract.
- **Locale and language policy:** English UI. System and generated content retain the user’s source language where the pipeline supports it.
- **Usage scene:** Laptop-first, focused sessions with dense reading and editing; mobile supports setup, review, and navigation without hiding core actions.
- **Register:** Hybrid. `/` is brand-led; `/app/*` is a task-first product workspace.
- **Memorable signature:** The alignment rail and paired-document composition communicate matching without decorative AI imagery.
- **Restraint:** Forms, result panels, settings, and long resume content use familiar controls, stable geometry, and quiet surfaces.
- **Anti-references:** Purple-gradient AI landing pages, floating glass cards, neon-on-black dashboards, and ornamental newspaper layouts.
- **Token ownership/runtime mapping:** Tailwind v4 variables in `src/app/globals.css` are the canonical runtime owner. This file mirrors accepted values and intent; shared primitives consume semantic utilities from the `@theme inline` adapter.

## Colors

Ink is the default text and navigation anchor. Paper is the application canvas and surface is reserved for interactive panels. Cobalt is the sole primary action and focus color. Teal means matched, connected, or complete; amber means attention; danger is reserved for errors and destructive actions. The landing page may use soft cobalt and teal tints, never multicolor decorative gradients.

## Typography

Manrope carries display and body roles, with compact tracking for headings and highly legible regular-weight body copy. IBM Plex Mono is restricted to job descriptions, resume source text, technical metadata, and short labels. Sentence case is the default. Uppercase is allowed only for small utility labels with increased letter spacing.

## Layout

The desktop app uses a 15rem labeled navigation sidebar that can retract to a 5rem icon rail, and a flexible content canvas. Below 48rem, navigation becomes a fixed bottom bar and content reserves the safe area. Product pages use a 80rem maximum width where reading benefits; the builder uses the full available canvas. Spacing follows a 0.25rem base with 1.25rem panel padding and 2.5rem control height.

## Elevation & Depth

Hierarchy comes from tonal surfaces, borders, and one subtle shadow on raised interactive panels. Static nested cards stay flat. Overlays may use a stronger shadow; decorative blur and glassmorphism are forbidden.

## Shapes

Controls use 0.625rem corners and content panels use 0.875rem corners. Pills are reserved for status and compact metadata. The alignment rail is the only deliberately linear signature and should not become general decoration.

## Components

### Foundational visual states

Hover increases contrast without moving layout. Focus uses a visible cobalt ring. Pressed controls translate by one pixel. Disabled controls retain readable labels at reduced contrast. Busy buttons keep their width and pair a spinner with unchanged action language. Teal, amber, and danger states always include text or an icon.

### Buttons and actions

Primary actions use solid cobalt. Secondary actions use a white or transparent surface with a border. Ghost actions support low-priority utilities. Danger is visually separated from primary work. Labels use direct verbs such as “Generate resume” and “Test connection.”

### Navigation and data display

Desktop navigation shows icon and label when expanded and retains accessible names and tooltips in its retractable icon-rail state; mobile uses a bottom bar with both. Current location is indicated by background, text, and `aria-current`. Pipeline tabs may scroll horizontally and keep the active item visible.

The builder uses one content navigator for generated artifacts. Pipeline execution status stays secondary: a compact current-stage label and progress line, never a second row of stage pills competing with the tabs.

### Forms and overlays

Fields have persistent labels, helper or error space, 2.5rem minimum height, and authored focus treatment. Textareas do not resize and instead use adequate fixed or flex height. File selection provides a centered, full-column button-equivalent drop zone with keyboard activation, drag state, accepted formats, selected file status, and recoverable errors. Provider and model use the shared authored Select.

### Iconography

Lucide icons use a 1.5–2px outline at 16–20px. Icons support labels rather than replacing them, except for universally understood compact controls with an accessible name and tooltip.

### Motion

Motion communicates state: a single entrance sequence on the landing hero, 120–180ms control transitions, and spinners for indeterminate work. `prefers-reduced-motion` disables nonessential animation and transforms.

### Content and data visualization

Copy is direct and candidate-centered. Avoid promises such as “perfect resume” or opaque pipeline jargon. Scores use tabular numerals and must include labels and denominators.

## Do's and Don'ts

- **Do:** Use the alignment rail when content genuinely represents matching or ordered pipeline progress.
- **Do:** Keep long-form work readable, stable, and recoverable across navigation states.
- **Don't:** Use purple gradients, glowing AI motifs, or decorative floating blobs.
- **Don't:** Hide navigation labels, core actions, or error recovery behind hover-only affordances.
