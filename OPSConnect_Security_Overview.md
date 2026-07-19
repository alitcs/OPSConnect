# OPSConnect — Security Overview

> **Audience:** Engineering / security team members who need context to design and
> harden the production security posture.
>
> **Important framing:** OPSConnect is currently a **prototype / mock**. Almost every
> "security" control described here is *demonstrative* — it models the shape of the
> real control so reviewers can see the intended behaviour, but it is **not** a real
> security boundary. This document is deliberately explicit about which parts are
> genuine, which are *hypothetical stand-ins*, and what each must become before
> production. Treat the "Production hardening" callouts as the actual requirements
> backlog.

---

## 1. Architecture at a glance

There are effectively **two** backends in this repo:

| Layer | Location | Role today |
|-------|----------|-----------|
| **Client-only mock backend** | `frontend/src/api/mockBackend.ts` | The build the demo actually runs on. All data lives in-browser (in-memory + `localStorage`). No network calls. |
| **Express REST backend** | `backend/src/` | A parallel, "what the real server looks like" reference implementation. Mirrors the same handlers/authorization but is not what the deployed demo uses. |

The frontend API client (`frontend/src/api/client.ts`) is wired to the **mock
backend**, not the Express server — it wraps synchronous mock calls in promises with
a small artificial latency so the UI *feels* like it's talking to a server.

```
frontend/src/api/client.ts  ──►  mockBackend.ts   (what the demo runs)
                                   (in-memory + localStorage)

backend/src/app.ts          ──►  Express + mockAuth  (reference only)
```

**Security consequence:** because the "server" runs entirely in the user's browser,
*every* authorization check in `mockBackend.ts` is trivially bypassable by anyone
with dev tools. This is fine for a demo, but it means **none** of the current checks
provide real confidentiality or integrity. They exist to demonstrate intended policy.

---

## 2. Authentication

### 2.1 What exists today (mock)

Authentication is a **browser-only, mock identity layer** implemented in
`frontend/src/api/auth.ts`.

- **Domain allow-list.** Only `@ontario.ca` email addresses may sign up or log in.
  Enforced by `isOntarioEmail()` using a strict regex
  (`^[^\s@]+@ontario\.ca$`, case-insensitive). This models "OPS staff only" access.
- **Three sign-in paths:**
  1. **Email + password sign-up/login** — accounts persisted in `localStorage`
     (`connectops.accounts`).
  2. **Built-in demo accounts** (`DEMO_ACCOUNTS`, e.g. `admin@ontario.ca` / `admin`)
     mapped to seeded directory profiles so reviewers land on a full profile.
  3. **Mock Microsoft Teams SSO** (`loginWithTeams()`) — a fake "Pick an account"
     picker that signs a reviewer straight into a seeded profile, and auto-provisions
     a fresh profile for any other `@ontario.ca` address (mirroring first-time SSO
     provisioning).
- **Sessions** are a single value in `localStorage`: `connectops.sessionUserId`.
  `isAuthenticated()` simply checks that this id exists. There is no token, no
  expiry, and no server-side session.
- **Password policy** (`PASSWORD_REQUIREMENTS` in `auth.ts`): ≥8 chars, upper +
  lower case, at least one digit. Enforced on sign-up and shown as a live checklist.

### 2.2 Password handling (mock — explicitly insecure)

Passwords are run through a **non-cryptographic** DJB2-style hash (`hashPassword()`):

```js
let hash = 5381;
for (...) hash = (hash * 33) ^ password.charCodeAt(i);
return (hash >>> 0).toString(16);
```

This is **not** password hashing. It has no salt, is not slow, and is reversible for
weak passwords. It exists only so that raw plaintext passwords aren't sitting in
`localStorage`. The demo-account passwords (e.g. `admin`) are stored/compared in
**plaintext**.

### 2.3 Production hardening — Authentication

- **Replace the entire mock auth layer with Microsoft Entra ID (Azure AD) via MSAL.**
  The code already flags this in multiple TODOs (`auth.ts`, `mockAuth.ts`). There
  should be no separate email/password path in production — SSO only.
- Validate a real **bearer/ID token** server-side on every request (signature,
  issuer, audience, expiry, nonce).
- Derive identity and admin/role claims from the token, **never** from a client-sent
  header or `localStorage` value.
- Enforce token **expiry and refresh**; add idle + absolute session timeouts.
- If any password path survives, use a real KDF (Argon2id / bcrypt / scrypt) with
  per-user salt — never the demo hash.
- Server-side domain/tenant restriction (tenant-locked Entra app), not a client regex.

---

## 3. Authorization

### 3.1 Request identity plumbing (Express reference)

In the Express backend, `backend/src/middleware/mockAuth.ts` reads an
**`x-user-id` header**, resolves it to a `User`, and attaches it as
`req.currentUser`. If the header is missing it falls back to `DEFAULT_USER_ID = 1`.

> ⚠️ **This is a spoofable identity.** Any client can set `x-user-id` to any value
> and become that user. This is the single most important thing to replace: identity
> must come from a validated token, not a caller-supplied header.

`app.ts` applies `mockAuth` to everything under `/api` except `/api/health`.

### 3.2 Authorization checks in the mock backend

Despite running client-side, `mockBackend.ts` *does* model a reasonable
authorization policy. The key gates:

- **Profile edits are self-only.** `updateUser()` throws `403` unless
  `userId === id`. Additionally, only a whitelist of fields (`EDITABLE_FIELDS`:
  skills, certifications, interests, aspirations, mentoringAreas, coopInfo,
  floorPublic, seatPublic, messagePrivacy) can be patched — so a user can't flip
  their own `isAdmin`, change their ministry, etc. This is a good **mass-assignment
  guard** pattern.
- **Admin-only analytics.** `adminInsights()`, `getConnectionGraph()`,
  `sendAdminChat()`, and all `*AdminConversation*` handlers throw `403` unless
  `viewer.isAdmin`. Admin status is assigned from a fixed `ADMIN_IDS` set at seed
  time (`u.isAdmin = ADMIN_IDS.has(u.id)`), not from user input.
- **Admin chat threads are scope-isolated.** Admin conversations are tagged
  `scope: 'admin'` and every read/delete re-checks both `isAdmin` **and**
  `conversation.userId === userId` **and** `scope === 'admin'`, so coordinators
  can't read each other's threads and members never see admin threads.
- **Direct-message threads are participant-scoped.** `getThread()` throws `404`
  unless `thread.participantIds.includes(userId)`, preventing thread enumeration.

### 3.3 Production hardening — Authorization

- Re-implement **every** check server-side, keyed off token-derived identity/roles.
  The current checks must be treated as UX hints, not enforcement.
- Keep the **field allow-list** pattern in `updateUser` on the server (it's a good
  mass-assignment defense). Never spread a client body directly onto a stored record.
- Model roles/permissions centrally (RBAC) rather than a hardcoded `ADMIN_IDS` set;
  source admin/coordinator role from Entra group membership or an authoritative store.
- Add authorization **audit logging** for admin analytics access (who viewed whose
  engagement data, and when).

---

## 4. Privacy controls (member-facing)

OPSConnect deliberately models **user-controlled privacy**, which is meaningful even
in the mock because it demonstrates the intended data-minimization policy:

- **Location sharing is opt-in and reciprocal.**
  - `floorPublic` / `seatPublic` booleans gate whether a user's floor/seat are ever
    returned. `toPublicProfile()` nulls out `floor`/`seat` for anyone viewing
    someone else's profile unless those flags are set.
  - `getUserLocation()` throws `403` if neither flag is set.
  - Proximity ("who's near me") is **reciprocal**: `proximityLabel()` returns a match
    only if *both* the viewer and the target have shared their floor. You can't see
    others' locations while hiding your own.
- **Message privacy preference.** `messagePrivacy` ∈ `everyone | ministry | none`.
  Enforced in `sendMessage()` on the **first** message of a new thread:
  - `none` → `403` "isn't accepting new messages".
  - `ministry` → `403` unless sender and recipient share a ministry.
  - Existing threads are always allowed to continue (gate is first-contact only).
- **Own-profile vs public-profile split.** `getUser()` returns the full record only
  when you request yourself; otherwise it returns `toPublicProfile()`.
- **Self-messaging blocked** (`toUserId === userId` → `400`).

### 4.1 Production hardening — Privacy

- Enforce all privacy gates server-side (currently client-side and bypassable).
- Consider that a **summary/directory** row (`toSummary`) still exposes name, title,
  team, ministry, status — confirm this is acceptable under OPS privacy policy, and
  make status/availability visibility configurable if needed.
- Add data-retention rules for messages, coffee-chat logs, and admin analytics.
- Ensure analytics aggregates cannot be **de-anonymized** (small teams/cohorts can
  make "aggregate" stats individually identifying).

---

## 5. Input handling & data integrity

- **Input validation is minimal.** Handlers check for required fields (e.g.
  `message is required`, `text is required`) and trim strings, but there is no
  schema validation, length capping, or content sanitization on most inputs.
- **XSS surface.** User-supplied text (profile fields, chat messages, direct
  messages, availability notes) is rendered in React. React escapes text by default,
  which mitigates most reflected/stored XSS — but any use of `dangerouslySetInnerHTML`
  or streaming/markdown rendering must be audited (the chat assistants stream tokens
  and render replies).
- **AI prompt-injection surface.** The chat assistants (`mockAIService.ts`,
  `generateConnectReply`, `generateAdminReply`) are keyword-based mocks today, so
  there's no real LLM to inject. When a real model is introduced, treat all
  directory/profile data and user messages as untrusted input to the model, and
  never let model output drive privileged actions (e.g. surfacing private
  locations, bypassing `messagePrivacy`).
- **IDs are numeric and sequential**, so object references are guessable — the
  authorization checks (not obscurity) are what must protect them (see IDOR below).

### 5.1 Production hardening — Input & integrity

- Add server-side **schema validation** (e.g. zod / class-validator) with strict
  length and character limits on every field.
- Centralize output encoding; forbid `dangerouslySetInnerHTML` on user content, or
  run it through a sanitizer (DOMPurify) if rich text is required.
- Rate-limit messaging and chat endpoints to prevent spam/abuse.
- Add a strict **Content-Security-Policy**, plus `X-Content-Type-Options`,
  `Referrer-Policy`, `X-Frame-Options`/frame-ancestors, and HSTS (via a middleware
  like `helmet`).

---

## 6. Transport, CORS & network posture

- The Express reference server enables **wide-open CORS** (`app.use(cors())` with no
  options) and logs with `morgan('dev')`. This is fine for local dev, unacceptable
  for production.
- The deployed demo is a **static client-only build** (see `netlify.toml`), so there
  is no server attack surface in the demo — but also no server-side enforcement of
  anything.

### 6.1 Production hardening — Transport/CORS

- **Lock CORS** to known origins with explicit methods/headers and credentials mode.
- Enforce **HTTPS/TLS everywhere**; redirect HTTP → HTTPS; enable HSTS.
- Restrict/replace verbose request logging in production; ensure logs don't capture
  secrets, tokens, or PII (message bodies, emails).

---

## 7. Secrets & data storage

- **No server secrets exist yet** because there's no real backend/data store.
- Client stores accounts, password hashes, and the session id in **`localStorage`**,
  which is readable by any script on the page (and survives across sessions). This is
  acceptable for a mock but must not hold real credentials or tokens.
- Seeded demo data (`users.json`, `conversations.json`, `projects.ts`) is bundled
  into the client — it is fictional and safe to expose, but confirm no real PII
  slips into seed data.

### 7.1 Production hardening — Secrets/storage

- Store tokens in secure, `HttpOnly`, `SameSite` cookies (or use MSAL's
  in-memory/session cache) rather than `localStorage`.
- Keep server secrets in a managed vault (Azure Key Vault); never commit them.
- Move all persistent data to a real datastore with encryption at rest, backups, and
  least-privilege access.

---

## 8. Summary: real vs. hypothetical

| Control | Status today | Real security value | Must become |
|---------|-------------|---------------------|-------------|
| `@ontario.ca` domain gate | Client regex | None (bypassable) | Tenant-locked Entra SSO |
| Login / sessions | `localStorage` id | None | Validated tokens + expiry |
| Password hashing | Non-crypto DJB2, plaintext demo pw | None | Argon2id/bcrypt or SSO-only |
| Identity plumbing (Express) | `x-user-id` header | None (spoofable) | Token-derived identity |
| Self-only profile edits | `403` in mock | Demonstrative | Server-side enforced |
| Field allow-list (mass-assignment guard) | Whitelist in `updateUser` | Good pattern | Keep, enforce server-side |
| Admin-only analytics | `isAdmin` gate | Demonstrative | RBAC via Entra groups |
| DM thread scoping | Participant check | Demonstrative | Server-side enforced |
| Location privacy (opt-in, reciprocal) | Flags + gates | Demonstrative | Server-side enforced |
| Message privacy (`everyone/ministry/none`) | First-contact gate | Demonstrative | Server-side enforced |
| Input validation | Minimal | Low | Schema validation |
| XSS protection | React auto-escaping | Partial | + CSP, sanitize rich text |
| CORS | Wide open | None | Origin allow-list |
| Transport | Static/dev | N/A | TLS + HSTS + security headers |

---

## 9. Priority backlog for the security team

1. **Replace mock auth with Entra ID / MSAL SSO** and validate tokens server-side.
   Remove the `x-user-id` header trust and all `localStorage`-based session logic.
2. **Move authorization enforcement to the server** — port every `mockBackend.ts`
   gate (self-edit, admin analytics, thread scoping, location/message privacy) to a
   real API keyed off token identity/roles. Keep the field allow-list pattern.
3. **Real RBAC** for coordinator/admin, sourced from an authoritative directory, not
   `ADMIN_IDS`.
4. **Input validation + output sanitization + security headers (helmet/CSP)** and
   **locked-down CORS**.
5. **Secure storage**: tokens out of `localStorage`; real encrypted datastore;
   secrets in a vault.
6. **Abuse controls**: rate limiting on messaging/chat; audit logging for admin
   analytics access.
7. **Privacy review**: retention policy, de-anonymization risk in aggregates,
   directory-summary exposure, and (future) AI prompt-injection boundaries.

---

### Key files referenced

- `frontend/src/api/auth.ts` — mock auth, password policy, Teams SSO mock
- `frontend/src/api/mockBackend.ts` — authorization + privacy gates
- `frontend/src/api/client.ts` — API client (wraps mock backend)
- `frontend/src/context/AuthContext.tsx` — session/auth state
- `backend/src/middleware/mockAuth.ts` — `x-user-id` identity plumbing (reference)
- `backend/src/app.ts` — Express wiring, CORS, route mounting (reference)
