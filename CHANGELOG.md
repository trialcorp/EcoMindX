# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [Semantic Versioning](https://semver.org/).

## [2.0.0] - 2026-06-19

### Added
- **Authentication System**: Integrated Supabase Auth for separate user registration, login, and secure session management.
- **Interactive History Migration**: Added a "Claim History" feature allowing signed-in users to link local anonymous calculations with their new account.
- **Sustain Analytics Dashboard**: High-fidelity dashboard widgets including a visual circular SVG score gauge and category-specific progress meters.
- **Community Hub Page**: Leaderboard showing ecological rankings, aggregated community impact stats, and interactive sustainability tips.
- **Gamified Eco-Challenges**: Quest tracker enabling users to accept, complete, and track green activities (e.g. Meatless Monday, Zero-Waste Weekend).
- **Progressive Input Wizard**: Restructured the carbon footprint questionnaire into a smooth, 3-step progressive layout with integrated range sliders.

### Changed
- Rebranded and redesigned the visual system to a premium, dark-glassmorphic style under the brand **EcoMindX**.
- Overhauled database schema migrations to define auth RLS security policies.

---

## [1.0.0] - 2026-06-11

### Added
- Carbon footprint calculation engine with cited emission factors (DEFRA 2023, EPA, IPCC / Our World in Data).
- Personalized insights: Google Gemini insights with a deterministic rule-based local fallback.
- Anonymous tracking history in Supabase database keyed by a random device ID in local storage.
- Accessible React + TypeScript SPA: semantic HTML, labelled controls, skip link, and data-table chart equivalent.
- Vitest unit & integration test coverage (47 assertions) for hooks, calculations, formatting, and components.
