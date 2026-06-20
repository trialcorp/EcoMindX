# Architecture — EcoMindX

EcoMindX is structured as a modern Serverless Single Page Application (SPA), deploying a React + TypeScript frontend that communicates directly with Supabase for data persistence, authentication, and AI insights.

## System Overview

```text
Browser (React + TS, Vite)                  Supabase (Cloud)
  • Progressive Wizard Form                 ├─ Authentication (Supabase Auth)
  • Sustain Analytics (SVG Gauges)          ├─ Database (public.entries table)
  • Gamified Quests & Social Hub            └─ Edge Functions (Deno Runtime)
  • Supabase JS Client  ───────────────────────► insights (calls Google Gemini)
```

## Backend Services (Supabase)

### 1. Database Layer (`public.entries`)
Stores lifestyle carbon assessments.
* **Columns**:
  * `id`: uuid primary key.
  * `created_at`: timestamp of creation.
  * `device_id`: anonymous tracker for non-logged-in history.
  * `input`: jsonb of questionnaire metrics.
  * `result`: jsonb of carbon breakdown figures.
  * `user_id`: uuid referencing `auth.users(id)` (optional, set when logged in).
* **Row Level Security (RLS)**:
  * Inserts allowed if anonymous (`user_id` is null) or if authenticated and matches `auth.uid()`.
  * Selects allowed for anyone if `user_id` is null, or restricted to `auth.uid()` if authenticated.

### 2. Authentication
Supabase Auth manages user profiles, passwords, and sessions. A "Claim History" feature links anonymous local history entries (matched by `device_id`) to the newly signed-in user's `user_id`.

### 3. AI Insights (Edge Function)
A Deno Dedge Function (`supabase/functions/insights`) is called by the client:
* Accepts the current input and calculated breakdown.
* Calls **Google Gemini** models to generate personalized summary text and action items.
* Falls back to a local rule-based insights system in case of Gemini timeout or quota exhaustion.

---

## Frontend Layout

| Concern | Location |
| --- | --- |
| **State & Auth Orchestration** | `src/hooks/useFootprint.ts` handles active user state, calculating, saving, and claiming local entries. |
| **Styling & Theme** | `src/styles/theme.css` implements a custom dark glassmorphic design system using pure CSS. |
| **Presentation Elements** | `src/components/` (Calculator step wizard, Result circle dials, Commitment checklist, Leaderboards, Quests, Auth forms). |
| **Types & Formats** | `src/lib/` (Supabase Client, format functions, type interfaces matching DB schema). |

---

## Quality Gates

Every push runs linting (ESLint + jsx-a11y), Prettier formatting checks, strict TypeScript type checking (`tsc --noEmit`), and Vitest test suites with enforced statement/branch thresholds.
