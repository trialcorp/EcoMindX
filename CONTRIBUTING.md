# Contributing to EcoMindX

Thank you for helping to improve **EcoMindX**. This document describes the local workflow and the quality bars every change must clear — the same gates CI enforces on every push.

## Project Layout

```text
supabase/    Supabase setup: migrations and Edge Functions (Gemini integrations)
frontend/    React + TypeScript SPA — components, hooks, api client, tests
docs/        Architecture notes
Dockerfile   Single-stage build compiling React SPA and serving via Nginx
```

## Development Setup

### Frontend (Node 20+)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install local dependencies:
   ```bash
   npm install
   ```
3. Run the Vite local development server:
   ```bash
   npm run dev
   ```

### Supabase Edge Functions (Deno)

To run the local edge functions, you must have Deno and the Supabase CLI installed.

1. Start local Supabase development containers:
   ```bash
   supabase start
   ```
2. Start the local server serving functions:
   ```bash
   supabase functions serve insights
   ```

---

## Quality Gates

All of these run in CI ([.github/workflows/ci.yml](.github/workflows/ci.yml)) and must pass before merging:

| Gate | Frontend Command | Description |
| --- | --- | --- |
| **Lint** | `npm run lint` | ESLint + jsx-a11y accessibility rules |
| **Format** | `npm run format:check` | Prettier compliance check |
| **Types** | `npm run typecheck` | Strict TypeScript compiler check |
| **Tests** | `npm run test:coverage` | Vitest suite checking coverage (>90% statements / >85% branches) |
| **Build** | `npm run build` | Compiles code and generates production bundles |

---

## Conventions

* **TypeScript**: Strict mode enabled, no `any`, exported functions and components carry clean JSDocs. 
* **Accessibility (a11y)**: Part of the definition of done. Reusable components must have automated `axe` assertions inside their test suites.
* **Security**: No secrets or access tokens committed to the repository. Client calls use env variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`) or user auth.
