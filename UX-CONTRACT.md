# RoleProof UX Contract

## Product context

- **Audience:** English-speaking candidates tailoring resumes for specific roles.
- **Primary jobs:** Maintain a trusted career record, connect an AI provider, and generate a supported role-specific resume.
- **Target markets and locale:** Global, English-first (`en`).
- **Accessibility target:** WCAG 2.2 AA.

The repository implementation and route structure are the current product evidence. No separate PRD, permission policy, billing flow, deletion lifecycle, or regulated workflow is present.

## Visual contract

- Project visual source: `DESIGN.md`.
- Runtime owner: Tailwind v4 semantic variables in `src/app/globals.css`.
- Shared component owners: `src/components/ui/*`.
- Drift gate: `designmd lint`, strict premium audit, lint, build, and responsive browser checks.

## Canonical UI Map

| Capability     | Canonical owner                                              | Source of truth                     | Allowed variants                 | Verification               |
| -------------- | ------------------------------------------------------------ | ----------------------------------- | -------------------------------- | -------------------------- |
| Select/Listbox | Shared authored Select in `src/components/ui/select.tsx`     | UX contract + shared primitive      | authored                         | keyboard + popup           |
| Form           | Shared Input, Textarea, Label, and Button primitives         | UX contract + shared primitives     | setup / edit                     | validation + browser flow  |
| Scrollbar      | Global application stylesheet                                | `DESIGN.md` + `src/app/globals.css` | geometry exceptions              | computed style             |
| Toast          | Shared Sonner provider in root layout                        | UX contract + shared provider       | success / warning / info / error | live region + browser flow |
| Authentication | Go auth service + Next.js server actions and HttpOnly cookie | API contract + UX contract          | credentials                      | unit + browser flow        |
| Authorization  | Shared page permission map + server-side page guard          | API role + UX contract              | workspace / administration       | unit + 403 browser flow    |
| Server state   | TanStack Query provider + authenticated Next route handlers  | Go API + PostgreSQL                 | resume / templates               | build + browser flow       |
| Resume editor  | Controlled master-resume editor                              | PostgreSQL master resume record     | autosave / manual save           | visible save state         |

## Component behavior

| Component    | Default        | Hover             | Focus       | Active        | Disabled              | Busy                            | Error                            |
| ------------ | -------------- | ----------------- | ----------- | ------------- | --------------------- | ------------------------------- | -------------------------------- |
| Button       | labeled action | stronger contrast | cobalt ring | 1px press     | non-interactive       | stable size + spinner           | inline recovery when needed      |
| Secret input | masked         | n/a               | cobalt ring | n/a           | non-interactive       | n/a                             | inline or toast with next action |
| Textarea     | resize none    | border contrast   | cobalt ring | n/a           | preserves value       | disabled only during owned work | associated text                  |
| File picker  | drop or choose | border contrast   | cobalt ring | native button | blocked while reading | spinner in stable zone          | inline recoverable message       |
| Save status  | saved          | n/a               | n/a         | dirty         | n/a                   | waiting / saving without reflow | persistent failed state + toast  |

## Flow ledger

| Operation                | Trigger                | Pending                    | Success destination     | Success feedback    | Failure recovery                      | Focus outcome       | Source ref                             |
| ------------------------ | ---------------------- | -------------------------- | ----------------------- | ------------------- | ------------------------------------- | ------------------- | -------------------------------------- |
| Add master resume        | Extract resume details | Stable busy button         | Master resume view      | saved state         | inline retry with source preserved    | result heading      | `src/app/app/resume/page.tsx`          |
| Test AI connection       | Test connection        | Stable busy button         | owning workspace        | shared toast        | error toast; settings preserved       | trigger             | `src/app/app/settings/page.tsx`        |
| Generate tailored resume | Generate resume        | Pipeline progress + cancel | results workspace       | completion banner   | inline error; input preserved         | results region      | `src/app/app/builder/page.tsx`         |
| Cancel generation        | Cancel                 | immediate cancellation     | current builder         | pipeline state      | job description preserved             | generate action     | `src/app/app/builder/page.tsx`         |
| Sign in                  | Sign in                | Stable busy button         | intended `/app/*` route | authenticated shell | inline generic error; email preserved | first invalid field | `src/app/login/page.tsx`               |
| Sign out                 | Sign out               | Stable busy button         | sign-in page            | signed-out state    | session remains until retry           | email field         | `src/components/layout/AppSidebar.tsx` |

## Navigation and responsive behavior

- Document title policy: `{Page} — RoleProof`; the root metadata provides the product fallback.
- Desktop uses a persistent labeled sidebar. Mobile uses a labeled bottom navigation bar with safe-area padding.
- Builder result tabs use the shared authored Tabs primitive and scroll horizontally when needed.
- Focus rings remain visible and content reserves space for persistent mobile navigation.
- `/app/*` is protected optimistically by `src/proxy.ts` and authoritatively by the Go-backed session check in the app layout. Successful sign-in returns to a safe intended `/app/*` path.
- The workspace navigation includes master-resume and template-gallery destinations on both desktop and mobile.
- Page permissions are defined once in `src/lib/auth/permissions.ts`; route layouts enforce them on the server. Direct navigation by an authenticated but disallowed role returns the app-owned 403 page. `/app/admin` is the concrete, intentionally unlinked admin-only boundary.

## Feedback and resilience

- Sonner is the sole toast provider; correctable field and file errors remain inline.
- Long-running AI work exposes progress and an explicit cancel action.
- Inputs are preserved after failure. Duplicate starts are blocked while the pipeline is running.
- Master resume content and reusable template specifications are user-owned PostgreSQL data. Resume edits debounce for 900 ms, serialize writes, and use optimistic versions to detect cross-session conflicts.
- Legacy browser resume data migrates only after the authenticated save succeeds. JSON import/export remains the user-controlled portability escape hatch.
- Uploaded template documents are parsed and sent to the configured AI provider from the browser. RoleProof persists only generic, AI-derived structure and writing guidance—not uploaded bytes or candidate-specific text.
- API keys remain masked by default and include an accessible show/hide action.
- Access tokens are stored only in a Secure-in-production, HttpOnly, SameSite=Lax cookie. Invalid credentials use one generic inline message, and password values are cleared after failed sign-in.
