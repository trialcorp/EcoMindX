# 🌱 EcoMindX — Personal Carbon Intelligence Platform

[![CI](https://github.com/Auenchanters/Virtual-Prompt-was-Week-3/actions/workflows/ci.yml/badge.svg)](https://github.com/Auenchanters/Virtual-Prompt-was-Week-3/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

> **EcoMindX** is a premium, high-fidelity web application designed to help individuals **understand, track, and reduce** their personal carbon footprint through an interactive dashboard, progressive lifestyle assessment, and **personalized AI-generated insights**.

Built as a modern Single Page Application (SPA): a **React + TypeScript** frontend styled with a custom dark-glassmorphism theme, powered by **Supabase** (Database & Edge Functions) and **Google Gemini** for real-time reduction plans.

---

## 🔗 Project Showcase

* **Brand Identity**: **EcoMindX** (Ecological Intelligence)
* **Design Aesthetic**: Premium Dark Mode, Frosted Glass, SVG Gauges, and Fluent Micro-Animations.
* **Interactive Tooling**: Live carbon commitments simulator. Check off reduction advice to immediately see simulated footprint decreases in real-time.

---

## 1. Core Pillars

| Pillar | In EcoMindX |
| --- | --- |
| **Understand** | Complete a 3-step progressive wizard covering mobility, utility, and diet inputs → get an instant visual dashboard breakdown. |
| **Track** | Save snapshots anonymously to your ledger (device-bound via Supabase) and analyze carbon trends with color-coded badges. |
| **Reduce & Simulate** | Receive personalized, quantified actions from Gemini. Check off items in the **AI Action Plan** to simulate your prospective savings. |

---

## 2. Architecture & Tech Stack

### High-Level Flow

```text
User Lifestyle Inputs (Mobility, utilities, diet)
        │
        ▼
Carbon Calculator Engine ──► Category Breakdown ──► Sustainability Score Dial
        │                                                     │
        ▼                                                     ▼
Comparison vs Targets                                 AI Insights Engine
                                            ├─ Gemini (Supabase Edge Function)
                                            └─ Smart rules local fallback
        │
        ▼
Save Snapshot (Supabase DB, anonymous device key) ──► Historical Ledger & Trend Badge
```

### The Stack

* **Frontend**: React 18, TypeScript, Vite, Vanilla CSS.
  * Custom Google Fonts (`Outfit` for headings, `Plus Jakarta Sans` for body).
  * 100% accessible inline SVGs for interactive graphs, gauges, and status badges.
* **Backend / Database**: Supabase.
  * Anonymous session storage bound to device IDs in local storage.
  * Edge Functions (`insights` invoking Gemini models with smart fallback rules).

---

## 3. Directory Layout

```text
supabase/    Supabase setup: migrations, schemas, and Edge Functions
  └─ functions/insights/      Edge Function invoking Google Gemini
frontend/    React + TS SPA
  ├─ src/components/         Form wizard, result gauges, commitments checklist
  ├─ src/hooks/              Footprint calculation & Supabase hooks
  ├─ src/styles/theme.css    Premium glassmorphic CSS stylesheet
  └─ src/test/               Vitest assertion suite (47 unit/integration tests)
docs/        Architecture specifications and notes
```

---

## 4. Running Locally

### Frontend Development

Ensure you have Node 20+ installed.

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```cmd
   npm install
   ```
3. Run the Vite development server:
   ```cmd
   npm run dev
   ```

### Supabase Edge Functions

Ensure you have the Supabase CLI installed.

1. Start local Supabase containers:
   ```bash
   supabase start
   ```
2. Deploy or test the Edge Functions:
   ```bash
   supabase functions serve insights
   ```

---

## 5. Verification & Testing

EcoMindX enforces strict coding standards and test coverage.

| Gate | Command | Description |
| --- | --- | --- |
| **Vitest Tests** | `cmd /c "npm run test"` | Runs 47 assertions covering hooks, components, layout math, and accessibility. |
| **Production Build** | `cmd /c "npm run build"` | Compiles TypeScript and bundles assets with Vite. |
| **Linting** | `npm run lint` | Asserts coding patterns and JSX-A11y requirements. |
| **Formatting** | `npm run format:check` | Checks compliance with Prettier configurations. |

---

## 6. Project Features & Visual Elements

### 📊 Progressive Carbon Assessment
The Carbon Calculator is broken down into a smooth, 3-step progressive wizard (Mobility, Home Utilities, Diet & Consumption) to reduce user cognitive load. Form inputs include range-sliders next to the numbers for micro-interactions.

### 📈 Sustain Analytics Dashboard
Displays a circular SVG dial showing your **Sustainability Score** (measuring proximity to the Paris Agreement target), side-by-side metric tiles (Emissions, Paris Target, Global Avg), and a color-coded bar chart breakdown.

### 💡 Interactive AI Commitments
Displays AI-personalized recommendations. Select any recommendation (e.g. "Take the train") to visually check it off; a dashed **Simulation Widget** instantly updates your projected footprint reduction.

### ⏳ Historical Trends
Tracks entries over time. Includes trend alerts that color-code improvements (Green downward trends, Red upward trends) to keep you motivated.

---

## License

[MIT](LICENSE) — Created for the EcoMindX personal carbon intelligence platform.
