# Security Policy — EcoMindX

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do not** open a public GitHub Issue.
2. Email your findings to the project maintainer with the subject **"[SECURITY] EcoMindX"**.
3. Include a clear description, reproduction steps, and potential impact.
4. We will respond within 72 hours and work with you on a fix before public disclosure.

---

## Security Architecture

### Privacy-First Data Model

EcoMindX follows a **privacy-by-default** philosophy:

- **Anonymous usage** — Users can calculate and track their footprint without creating an account. Data is bound to a random `device_id` stored in `localStorage`.
- **Optional authentication** — Supabase Auth manages user sessions. When a user signs up, they can optionally claim their anonymous history.
- **No PII collection** — The carbon calculator collects only lifestyle metrics (km driven, kWh consumed, diet type). No names, addresses, or personally identifying information is stored.

### Row Level Security (RLS)

All database tables enforce Supabase Row Level Security:

| Table | Insert Policy | Select Policy | Update / Delete Policy |
|-------|---------------|---------------|------------------------|
| `entries` | Authenticated users insert their own rows; anonymous users insert with `user_id = null` | Users see their own rows; anyone can see anonymous rows | Only for claiming anonymous history (user_id transition) |
| `community_tips` | Restricted to authenticated users (`user_id = auth.uid()`) | Open to all | Users can delete only their own tips |
| `profiles` | Trigger-created on signup | Public read | Users update only their own profile |

### Input Sanitization & Validation

All user-facing inputs are validated and sanitized at multiple layers:

#### Client-Side (Frontend)
- **Carbon Calculator**: Numeric inputs are clamped to defined bounds (e.g., 0–20,000 km/week, 0–200 flights/year) via centralised constants in `lib/constants.ts`. NaN values are coerced to 0. HTML `<input type="number">` with `min`/`max` attributes enforced.
- **Community Tips**: Text inputs are stripped of HTML via `DOMParser` parsing and length-capped using shared constants (`MAX_TIP_TITLE_LENGTH: 60`, `MAX_TIP_DESC_LENGTH: 200`, `MAX_TIP_AUTHOR_LENGTH: 50`).
- **Authentication**: Email validated via `type="email"`, password minimum length enforced (8 characters).

#### Server-Side (Edge Function)
- **Numeric Bounds Validation**: All carbon input values are independently validated and clamped to the same bounds as the frontend, preventing tampered API requests from injecting out-of-range values.
- **Enum Validation**: Car fuel types and diet types are validated against an allowlist of valid string values.
- **Request Size Limit**: A 100 KB maximum request body size is enforced to prevent denial-of-service attacks.

### Edge Function Security

The Supabase Edge Function (`insights`) that calls Google Gemini:

- Validates and sanitises the request body structure before processing.
- Uses a structured JSON response schema (`responseMimeType: "application/json"`) to prevent prompt injection attacks on the Gemini output.
- Falls back gracefully — returns HTTP 503 so the client uses its deterministic rule-based engine on any API failure.
- Does not expose API keys to the client — `GEMINI_API_KEY` is stored as a server-side secret in the Deno runtime environment.
- Applies CORS origin allowlisting — only `localhost:5173` and the production domain are accepted.

### Transport Security

- All client–server communication uses HTTPS (enforced by Supabase and Vercel).
- Security headers configured in `vercel.json`:
  - `Content-Security-Policy` — restricts script/style sources, includes `base-uri 'self'` and `form-action 'self'` to prevent base tag hijacking and form submission to external origins.
  - `X-Frame-Options: DENY` — prevents clickjacking.
  - `X-Content-Type-Options: nosniff` — prevents MIME-type sniffing.
  - `Referrer-Policy: strict-origin-when-cross-origin` — limits referrer leakage.
  - `Strict-Transport-Security` — enforces HTTPS for 1 year with `includeSubDomains`.
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()` — disables unused device APIs.

### Secret Management

- `.env` and `.env.local` files are excluded from version control via `.gitignore`.
- Supabase Edge Function secrets are stored via `supabase secrets set` and never committed to the repository.
- The Supabase anonymous key (`VITE_SUPABASE_ANON_KEY`) is intentionally public — it only grants access permitted by RLS policies.

### Dependencies

- Dependencies are kept minimal and regularly auditable (`npm audit`).
- No server-side dependencies beyond Supabase client SDK and Google Fonts.
- The Supabase Edge Function runs in a sandboxed Deno runtime.

---

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.1.x   | ✅ Active |
| < 1.1   | ❌ No     |
