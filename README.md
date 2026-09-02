# RoleProof

An agentic resume builder. Give it your master resume and a job description. It analyzes, maps, generates, then loops — critique, revise, critique, revise — until the AI can't find anything left to improve. The AI pipeline and provider keys remain local-first; the Go and PostgreSQL backend owns accounts, master resumes, and reusable template specifications.

## The idea

LLM-generated resumes are mediocre on the first pass. A human doesn't write a resume once — they draft, review, notice weak spots, fix them, re-read, tweak again. This project gives that loop to an AI.

The pipeline:

```
JD Analysis → Experience Mapping → Resume Generation
                ↑                        ↓
                └──── Critique Loop ◄─────┘
                     (scores, finds weaknesses,
                      generates prioritized revision plan,
                      rewrites weak sections,
                      checks if it's actually
                      better, repeats)
                         ↓
                    ResumeSpec → LaTeX Source → HTML Preview → Verification → Export
```

The AI critiques its own output as a senior hiring manager would — scoring across ATS compatibility, relevance, impact quantification, clarity, career progression, and authenticity. Each suggestion is categorized (fabrication, impact, ATS, clarity, content) for prioritized surgical revision. It tracks recurring weaknesses across iterations so it doesn't chase its own tail. It keeps the best-scoring version, not just the last one.

### Convergence

Multi-signal convergence detection — no single heuristic decides "done":

| Signal            | Condition                                                               |
| ----------------- | ----------------------------------------------------------------------- |
| Score ceiling     | Overall ≥ 95 AND ATS ≥ 90                                               |
| Score stagnation  | Delta < 3 points for 2 consecutive rounds (score ≥ 75, ATS ≥ 80)        |
| No new weaknesses | Critique found nothing new to fix (score ≥ 75)                          |
| Stale critique    | Weaknesses + suggestions ≥ 80% Jaccard overlap for 2 consecutive rounds |
| No resume change  | Resume text ≥ 95% similar to previous iteration                         |
| LLM judgment      | Model self-reports `isConverged: true` (score ≥ 85)                     |

Hard cap at 50 iterations. Usually converges in 4–7.

### Auto-fit

After generation, the ResumeSpec is rendered to HTML and measured in a real browser layout engine. Content that overflows 1 letter-size page triggers progressive font-size shrinking (5 levels, 0.5pt per level) until it fits. The final PDF is generated from the shrunk spec with measurement-driven sizing.

## A few things about how it's built

- **Local-first AI, durable resume data.** Provider keys stay in `localStorage` and the browser talks directly to AI providers. Authenticated master resumes and template specifications sync through the Go API to PostgreSQL, with JSON import/export for portability.
- **Reusable resume templates.** Four curated templates ship with the database, and users can upload a PDF, DOCX, or TXT template. The browser sends its text to the configured AI provider; RoleProof stores only generic structure and writing guidance, not the uploaded document or candidate-specific content.
- **Multi-provider.** DeepSeek, OpenAI, Anthropic, Google (Gemini), and OpenRouter. Per-provider API key storage with legacy key migration. Each provider has its own request body builder and response parser (Anthropic's Messages API and Google's generateContent differ from the OpenAI-compatible shape).
- **9 distinct prompts**, each with a specific job. The resume generation prompt is ~150 lines covering the impact framework, quantification tiers, role tailoring, and inference rules. A privacy-constrained template prompt extracts only reusable structure and tone.
- **The convergence logic is explicit**, not just asking the LLM "are we done?" It cross-checks staleness, dual score ceilings, delta stagnation, and LLM self-judgment — with protections against infinite critique loops.
- **LaTeX output** via a deterministic template (not LLM-generated `.tex` — those hallucinate). Compiles to a 1-page letter-size PDF with proper typesetting.
- **Everything is typed.** Full TypeScript interfaces for the pipeline state, resume structure, critique results, revision plans, and LaTeX spec.

## Quick start

```bash
git clone https://github.com/FoxxPratikSau/roleproof.git
cd roleproof && npm install && npm run dev
```

You'll need an API key from any supported provider: [DeepSeek](https://platform.deepseek.com/api_keys), [OpenAI](https://platform.openai.com/api-keys), [Anthropic](https://console.anthropic.com/), [Google AI](https://aistudio.google.com/apikey), or [OpenRouter](https://openrouter.ai/keys). Paste it in Settings, upload your resume, paste a JD, hit Generate.

## Backend

The backend is a separate Go module in `backend/`. It uses PostgreSQL through `pgx`, applies embedded `golang-migrate` migrations automatically before listening, hashes passwords with bcrypt, issues short-lived HS256 JWT access tokens, and enforces tenant ownership for resumes and uploaded templates.

The Next.js login flow exchanges credentials with the Go API on the server and stores the signed access token in an HttpOnly cookie. Set `ROLEPROOF_API_URL` when the API is not available at `http://localhost:8080`.

### Run with Docker Compose

Docker Compose is the simplest path and starts PostgreSQL and the API together. Migrations run automatically inside the API container.

```bash
cp .env.example .env
docker compose up --build
```

Seed the required test account after the containers are healthy:

```bash
docker compose exec db psql -U roleproof -d roleproof \
  -v ON_ERROR_STOP=1 -f /migrations/seed.sql
```

The seed is idempotent and creates:

```text
Email:    test@example.com
Password: password123
```

### Run without Docker

Create a PostgreSQL database, then run the API from the Go module. The API applies all pending migrations automatically.

```bash
cd backend
export DATABASE_URL='postgres://roleproof:roleproof-local-password@localhost:5432/roleproof?sslmode=disable'
export JWT_SECRET='replace-this-with-at-least-32-random-bytes'
go run ./cmd/api
```

In another terminal, apply the seed explicitly:

```bash
cd backend
export DATABASE_URL='postgres://roleproof:roleproof-local-password@localhost:5432/roleproof?sslmode=disable'
make seed
```

Rollback and reapply one atomic migration when developing locally:

```bash
cd backend
make migrate-down
make migrate-up
```

### Authentication API

```text
POST http://localhost:8080/auth/register
POST http://localhost:8080/auth/login
GET  http://localhost:8080/auth/me
GET  http://localhost:8080/health
GET/PUT/DELETE http://localhost:8080/master-resume
GET/POST       http://localhost:8080/resume-templates
GET/DELETE     http://localhost:8080/resume-templates/{id}
```

Example registration body:

```json
{
  "name": "Pratik Sau",
  "email": "pratik@example.com",
  "password": "RoleProof1!"
}
```

New passwords require at least 8 characters and must include an uppercase
letter, lowercase letter, number, and symbol. The frontend also asks users to
confirm the password before registration.

Every response uses JSON. Validation failures return field-level errors, invalid credentials return `401`, authorization middleware returns `403`, and unknown routes return `404` with `{ "error": "not found" }`.

Backend verification:

```bash
cd backend
go test ./...
go test -race ./...
go vet ./...
DATABASE_URL='postgres://roleproof:roleproof-local-password@localhost:5432/roleproof?sslmode=disable' \
  go test -tags=integration ./internal/postgres
```

## Deploy to Render

The repository includes a `render.yaml` Blueprint that provisions the complete
production stack in Render's Singapore region:

- `roleproof-web`: the public Next.js application at
  `roleproof.pratiksau.xyz`;
- `roleproof-api`: the private Dockerized Go API;
- `roleproof-db`: private managed PostgreSQL 18.

In Render, choose **New → Blueprint**, connect this repository, and deploy the
Blueprint. Render generates the JWT secret and injects private service and
database connection details automatically. The Blueprint uses the smallest
always-on compute plans, so review the estimated monthly cost before confirming.

After the services are healthy, add the DNS record Render displays for
`roleproof.pratiksau.xyz` at the domain's DNS provider, then verify the domain
in Render. Do not seed the production database with local demo data.

## Stack

Next.js 16 · React Query · TypeScript · Tailwind CSS v4 · Go · PostgreSQL · pgx · golang-migrate · JWT · bcrypt · shadcn/ui · DeepSeek / OpenAI / Anthropic / Google / OpenRouter · pdfjs-dist · mammoth · jsPDF · docx · LaTeX

## Dev tooling

Prettier (with `prettier-plugin-tailwindcss`) · ESLint v9 flat config (core-web-vitals, typescript, prettier, tailwindcss) · Husky v9 + lint-staged (pre-commit: eslint --fix + prettier) · commitlint (Conventional Commits) · knip (dead code detection) · EditorConfig · VS Code workspace settings

```bash
npm run dev          # Start dev server at localhost:3000
npm run build        # Production build
npm run lint         # ESLint
npm run format       # Prettier --write
npm run format:check # Prettier --check
npm run knip         # Dead code detection
npm run sort-pkg     # Canonical package.json ordering
```

## Structure

```
src/
  app/
    app/
      builder/       # Pipeline orchestration page
      resume/        # Master resume editor + AI extraction from PDF/DOCX
      templates/     # Curated gallery + AI-assisted template upload
      settings/      # Provider + API key + model selection
  hooks/
    usePipeline.ts      # State machine, 7-step pipeline, critique loop
    useResumeExtraction.ts  # PDF/DOCX → structured MasterResume
    useListField.ts         # Reusable list field management
    useResumeData.ts        # TanStack Query hooks for resume/template server state
  lib/
    ai/
      prompts.ts         # 8 system prompts
      provider.ts        # Multi-provider dispatch (5 providers)
      json-parser.ts     # Robust JSON extraction from LLM output
    pipeline/
      classification.ts  # Categorized suggestions + priority
      constants.ts       # All tuning knobs
      context-builder.ts # Critique and revision context assembly
      convergence.ts     # Multi-signal convergence detection
      revision-parser.ts # Revision report extraction
      revision-planner.ts # Prioritized action plan from critique
      similarity.ts      # Jaccard + resume text similarity
    latex/
      engine.ts          # Browser LaTeX engine (local compilation)
      template.ts        # Deterministic .tex template
      render.ts          # ResumeSpec → HTML
      measure.ts         # Browser layout measurement
      shrink.ts          # Auto-shrink to 1 page
      verify.ts          # LaTeX compilation verification
      verify-builder.ts  # Verification result assembly
    export/
      index.ts           # TXT, DOCX, PDF (plain + spec), .tex download
    parse/
      pdf.ts             # PDF text extraction (pdfjs-dist)
      docx.ts            # DOCX text extraction (mammoth)
    storage/
      local.ts           # Provider keys, preferences, and legacy resume migration
    utils.ts             # uid(), clamp(), sleep()
  components/
    layout/              # AppSidebar
    pipeline/            # CritiquePanel, ExperienceMappingPanel, JDAnalysisPanel,
                         #   LaTeXEditor, LaTeXPreview, PipelineProgress,
                         #   ResumeDisplay, VerificationPanel
    resume/              # ResumeEditor, ResumeInput, JsonImportExport
    ui/                  # shadcn/ui primitives (badge, button, card, dialog, etc.)
    ErrorBoundary.tsx
  types/
    index.ts             # All TypeScript interfaces
```

The backend is organized separately:

```text
backend/
  cmd/api/                    # Composition root and graceful shutdown
  internal/auth/              # Registration, login, bcrypt, JWT
  internal/resume/            # Master-resume and template domain service
  internal/config/            # Environment configuration
  internal/database/          # PostgreSQL pool and automatic migrations
  internal/httpapi/           # JSON handlers and middleware
  internal/postgres/          # Explicit parameterized queries
  migrations/schema/          # Atomic up/down schema migrations
  migrations/seed.sql         # Idempotent local test user
```

Start in `src/hooks/usePipeline.ts` (the state machine) and `src/lib/ai/prompts.ts` (the prompts).

## License

MIT
