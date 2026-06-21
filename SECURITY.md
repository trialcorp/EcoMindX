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

| Table | Insert Policy | Select Policy | Update Policy |
|-------|---------------|---------------|---------------|
| `entries` | Authenticated users insert their own rows; anonymous users insert with `user_id = null` | Users see their own rows; anyone can see anonymous rows | Only for claiming anonymous history |
| `community_tips` | Restricted to authenticated users (`user_id = auth.uid()`) | Open to all | N/A |
| `profiles` | Trigger-created on signup | Public read | Users update only their own profile |

### Input Sanitization

All user-facing inputs are validated and sanitized:

- **Carbon Calculator**: Numeric inputs are clamped to defined bounds (e.g., 0–20,000 km/week, 0–200 flights/year). NaN values are coerced to 0. Input type `number` with `min`/`max` attributes enforced.
- **Community Tips**: Text inputs are stripped of HTML tags (`<[^>]*>` regex), enforcing maximum character limits (title: 100, description: 500, author: 50).
- **Authentication**: Email validated via `type="email"`, password minimum length enforced (6 characters).

### Edge Function Security

The Supabase Edge Function (`insights`) that calls Google Gemini:

- Validates request body structure before processing.
- Uses a structured JSON response schema to prevent prompt injection attacks on the Gemini output.
- Falls back gracefully to a deterministic rule-based engine on any API failure.
- Does not expose API keys to the client — `GEMINI_API_KEY` is stored as a server-side secret.

### Transport Security

- All client–server communication uses HTTPS (enforced by Supabase and Vercel).
- Security headers configured in `vercel.json`:
  - `Content-Security-Policy` — restricts script/style sources.
  - `X-Frame-Options: DENY` — prevents clickjacking.
  - `X-Content-Type-Options: nosniff` — prevents MIME-type sniffing.
  - `Referrer-Policy: strict-origin-when-cross-origin` — limits referrer leakage.
  - `Strict-Transport-Security` — enforces HTTPS for 1 year.

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
