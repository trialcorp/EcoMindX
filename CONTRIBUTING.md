# Contributing to EcoMindX

Thank you for your interest in contributing to EcoMindX! This guide outlines our development standards and workflow.

## Development Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/<your-username>/EcoMindX.git
   cd EcoMindX/frontend
   npm install
   ```

2. **Configure environment**:
   ```bash
   cp ../.env.example .env
   ```
   Add your `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

3. **Run locally**:
   ```bash
   npm run dev
   ```

## Code Quality Standards

### TypeScript
- All code must be written in **strict TypeScript** (`strict: true` in `tsconfig.json`).
- No implicit `any` types — every variable, parameter, and return type must be explicit.
- All exported functions, interfaces, and types must include **JSDoc** documentation with `@param` and `@returns` tags.

### Linting & Formatting
- Run `npm run lint` before committing. Zero ESLint warnings or errors are accepted.
- Run `npm run format` to apply Prettier formatting automatically.
- The project enforces `react-hooks/exhaustive-deps: "error"` — no eslint-disable overrides for this rule.

### Architecture
- **Hooks** handle business logic and state (`useAuth`, `useCommunity`, `useFootprint`).
- **Components** are purely presentational — they receive data via props and emit callbacks.
- **Utilities** (`lib/`) are stateless, pure functions with no side effects.
- **Constants** (`lib/constants.ts`) centralise all validation bounds and magic numbers.
- **Barrel exports** (`index.ts` files) provide clean module boundaries for each directory.

### Security Practices
- All user-generated text (tips, author names) must be sanitised via `DOMParser` and length-capped.
- Numeric inputs must be clamped to defined bounds on both client and server.
- Never expose API keys in client-side code — sensitive keys belong in Supabase Edge Function environment variables.
- All database tables must have Row Level Security (RLS) policies enabled.

## Testing

- Run `npm test` to execute the full test suite (Vitest + React Testing Library).
- Run `npm run test:coverage` to generate coverage reports.
- New features must include corresponding unit tests maintaining ≥ 90% coverage.
- Accessibility tests use `vitest-axe` — all components must pass Axe-Core compliance.

## Commit Messages

Follow conventional commit format:
```
feat: add new dietary comparison chart
fix: correct household size division-by-zero
docs: update README emission factor sources
test: add edge-case calculator tests
```

## Pull Request Checklist

- [ ] `npm run typecheck` passes with zero errors
- [ ] `npm run lint` passes with zero violations
- [ ] `npm run format:check` reports no formatting issues
- [ ] `npm test` passes all tests
- [ ] New code includes JSDoc documentation
- [ ] Security: user inputs are sanitised and validated
