# ConnectOPS — Resume Project Brief (for an LLM resume-writing assistant)

> **How to use this file:** Give this document to an LLM (ChatGPT, Claude, etc.) along with
> your resume and target job description. Ask it to write resume bullet points, a project
> section, and/or tailor the phrasing to a specific role. This file contains every useful,
> truthful detail about the project so the LLM has full context. Nothing here is invented —
> it all reflects what was actually built and pitched.

---

## TL;DR (the elevator version)

**ConnectOPS** is an AI-powered organizational knowledge-retrieval and people-discovery web
application built for the **Ontario Public Service (OPS)**. It helps a ~66,000-person
organization find the right *person, skill, project/ticket context, and next step* in
**seconds instead of hours**, through a chat-first assistant plus a companion web app.

- **Context:** Built for the **OGT ("Ops Got Talent") Summer 2026 Student Proposal
  competition / hackathon.** Track: Knowledge Retrieval & Information Access (also advances
  Onboarding & Time-to-Productivity).
- **Result: Won 3rd place** at the hackathon / competition.
- **Team of 4:** Jackie Liang, Richard Duc Anh Nguyen, Manraj Rakhraj, Ali Hamoudi.
- **Deliverable:** A fully working full-stack prototype (React + TypeScript + Vite frontend,
  Node + Express + TypeScript backend) running on a mock backend that stands in for
  Microsoft Copilot + governed OPS data sources, plus a full business case (cost model, ROI,
  security posture, rollout roadmap) and a live deployed demo (`connectops.netlify.app`).

> **Note on your role:** This brief describes the whole project. When writing your resume,
> emphasize the parts *you personally* built. If you're unsure which parts were yours, the
> "Suggested resume bullets" section below is written so you can pick the ones that match
> your actual contribution and drop the rest.

---

## Achievement / recognition (mention this on the resume)

- **Placed 3rd** at the **OGT Summer 2026** hackathon / student proposal competition
  (Ontario Public Service). Judged on solution quality, technical execution, financial
  feasibility, and long-term sustainability.
- Competed against other student teams; delivered a working prototype **plus** a complete
  public-sector business case within the competition constraints.

---

## The problem it solves (good for a project summary line)

In a large organization, the knowledge already exists — but the *people and places* that
hold it are hard to reach. Staff act on partial context (a ticket number, a system name, a
vague problem) and lose time hunting across disconnected systems (ESMT, Forte, email, Teams,
SharePoint) to find the right owner, expert, or next step. Cited research: knowledge workers
lose **~1.8 hrs/day (~20% of the workweek)** searching for information and chasing colleagues
(McKinsey). ConnectOPS turns that friction from hours into seconds.

---

## Tech stack (for a "Technologies" line)

**Frontend**
- React 18 + TypeScript + Vite (SPA, mobile-first responsive UI)
- React Router (client-side routing)
- `react-force-graph-3d` (WebGL / Three.js) for an interactive **3D connection network graph**
- Context API for auth/session, theme (light/dark), toasts, and preview-card state
- Plain CSS (global stylesheet + CSS custom properties for theming); WCAG 2.2 AA target

**Backend**
- Node.js + Express + TypeScript (REST API)
- Layered architecture: **routes → controllers → services → data**
- `cors`, `morgan` (logging); `tsx` for dev, `tsc` for build
- In-memory / JSON seed data store (structured like real relational data)
- Mock authentication middleware (models token-based identity for production swap)

**AI layer**
- A **mock AI service** that simulates an LLM: parses queries for keywords/intents
  (skills, departments, names, ticket/system references) and returns realistic, cited,
  explainable responses. Deliberately designed so it can be swapped for **Microsoft Copilot**
  or a Python AI microservice later *without changing the response contract* (`AIReply`).
- Handles **9+ distinct intent types**: person lookup, project/ticket intelligence, skill
  discovery, team discovery, project staffing with capability-gap detection, co-op
  onboarding, field/career exploration, "shadow-a-mentor," and counting queries.

**Tooling / deployment**
- npm workspaces monorepo (runs frontend + backend together)
- Vite dev proxy (`/api` → backend, no CORS config needed in dev)
- Deployed live via **Netlify** (`connectops.netlify.app`); presentation built with Marp

---

## Architecture highlights (for technical depth on the resume)

- **Deliberately layered, swappable architecture.** Every mock component (data store, AI
  service, auth) is abstracted behind a stable interface so it can be replaced one at a time
  with a real implementation (real database, Microsoft Copilot, Microsoft Entra ID / Azure AD
  via MSAL) — demonstrating production-forward design thinking, not just a throwaway demo.
- **Two parallel backends** to prove the concept end-to-end: a client-side mock backend
  (in-browser, `localStorage` + in-memory, powers the live demo) and a full **Express REST
  reference backend** mirroring the same handlers and authorization policy.
- **Governance-first AI design principle:** *"The AI routes and phrases; governed queries
  supply the facts; the permission layer decides what may be shown."* The model never stores
  data, invents facts, or makes access-control decisions — result cards render from the query,
  not from model text. (Strong talking point for AI-safety-aware roles.)

---

## Key features built (pick the ones you worked on)

**Core app**
- **AI chat assistant** (homepage): conversational people/knowledge search with sidebar
  conversation history and inline **mini-profile cards** that explain *why* each person was
  surfaced (a contextual rationale + confidence/match strength).
- **Employee directory:** filterable list (department, team, location, title).
- **Profile pages:** a clean "business card" view plus extended info and user-controlled
  privacy toggles.
- **Direct messaging:** lightweight inbox/threads for initial outreach (a bridge to Teams).
- Consistent interaction pattern app-wide: **mini card → preview card → full profile.**

**Manager / coordinator tooling (a standout differentiator)**
- **The Connection Network:** a live, interactive **3D force-directed graph** where every
  employee is a node. Users switch the "lens" (edge mode) — logged coffee-chat connections,
  same team/ministry/division, shared skills/interests, same project, reporting line,
  location, mentorship, cohort — and the entire visualization re-renders. Surfaces isolated
  or newly-arrived staff, informal "connector" employees who bridge the most ministries, and
  **single-person knowledge-dependency risks**.
- **Coordinator analytics page:** a leadership view readable in ~30 seconds — adoption /
  active users, cross-team & cross-ministry collaboration, most/least connected teams,
  knowledge concentration & gaps, and onboarding health for new co-ops.
- **Manager chat:** plain-language analytics with no dashboards to learn — e.g. *"Who on my
  team is isolated?", "How are Priya and Marcus connected?", "Which active projects have
  staffing gaps, and who can fill them?"*

**Security & privacy modeling (good for security-conscious roles)**
- Modeled a realistic authorization policy: **self-only profile edits** with a **field
  allow-list (mass-assignment guard)**, **admin-gated analytics**, **scope-isolated admin
  chat threads**, and **participant-scoped message threads** (prevents thread enumeration).
- **Privacy-by-design controls:** opt-in and **reciprocal** location sharing (you can't see
  others' location while hiding your own), configurable message-privacy preferences
  (`everyone | ministry | none`), and an own-profile vs. public-profile data split.
- Authored a detailed **Security Overview** documenting current mock controls vs. required
  production hardening (Entra ID/MSAL SSO, server-side token validation, RBAC from group
  membership, Argon2id/bcrypt hashing, audit logging, OWASP-aware input handling).

---

## Business case / product work (for PM, consulting, or "impact" framing)

Beyond code, the team produced a full public-sector business case:
- **Cost model:** 3-year budget of **~$1.43M** against a **$1.5M** ceiling ($500k/yr,
  front-loaded), including a ~$150k (~12%) contingency and ~16% total buffer. Bottom-up
  staffing model on fully-loaded OPS salaries (base × 1.40), deliberately staffed with
  permanent staff + co-op students (a contractor team would cost ~1.4–2× more and breach
  the cap).
- **ROI:** conservative **~$4M+/year** in reclaimed staff time at scale; payback in **under
  6 months**; ~9–10× annual return vs. steady-state run cost; still returns **>2×** total
  cost even at 25% of projected adoption.
- **Compliance angle:** data stays in the OPS/Canada tenant, Copilot doesn't train on OPS
  data, SSO via ontario.ca identity, RBAC, audit logging, encryption in transit/at rest,
  WCAG 2.2 AA accessibility.
- **4-phase rollout roadmap** (Discovery & Design → Foundation Build → Data Integration →
  Pilot & Rollout) with defined success metrics (e.g. time-to-answer from hours to <60s,
  ≥80% requests resolved without re-routing, 100% grounded/cited answers).

---

## Quantified facts you can cite (all real to the project)

- **3rd place** at the OGT Summer 2026 competition/hackathon.
- **Team of 4.**
- Targets a **~66,000-employee** organization.
- **9+ AI intent types** handled by the assistant.
- **3D connection graph** with **10+ relationship "lens" modes**.
- Full-stack **TypeScript** across frontend and backend (monorepo, npm workspaces).
- Live deployed demo on **Netlify**.
- ~1.8 hrs/day knowledge-worker time-loss problem (McKinsey) → target <60s.

---

## Suggested resume bullet points (edit to match YOUR contribution)

**Header line options:**
- *ConnectOPS — AI-Powered Organizational Knowledge & People-Discovery Platform (3rd Place,
  OGT Summer 2026 Hackathon)*
- *ConnectOPS — Full-Stack TypeScript Web App · Hackathon 3rd Place*

**Bullet options (choose 3–5 that reflect what you did):**
- Built a full-stack **React + TypeScript + Vite** and **Node/Express** web app that lets
  users find the right person, skill, or answer in **seconds instead of hours**; **placed 3rd**
  out of competing teams at the OGT Summer 2026 hackathon.
- Designed a **layered, swappable architecture** (routes → controllers → services → data) so
  mock components (AI, auth, database) could be replaced with production services (Microsoft
  Copilot, Entra ID/MSAL, a real DB) without changing API contracts.
- Implemented an **AI chat assistant** handling **9+ query intents** (person lookup, skill &
  project discovery, staffing gap detection, onboarding) that surfaces people as inline cards
  with an explainable rationale and confidence score.
- Developed an interactive **3D connection-network graph** (`react-force-graph-3d` / WebGL)
  with **10+ relationship lenses** to reveal isolated staff, cross-ministry connectors, and
  single-person knowledge-dependency risks.
- Engineered a governance-first authorization and **privacy-by-design** model: self-only edits
  with a mass-assignment field allow-list, admin-gated analytics, scope-isolated threads, and
  opt-in reciprocal location sharing.
- Authored a public-sector **security posture and OWASP-aware hardening plan** (SSO,
  server-side token validation, RBAC, strong password hashing, audit logging).
- Co-produced a complete **business case** — 3-year ~$1.43M cost model, ~$4M+/yr ROI, and a
  4-phase rollout roadmap — presented to competition judges alongside a live deployed demo.

---

## Skills this project demonstrates (for a skills section / keyword matching)

TypeScript · React · Node.js · Express · REST API design · Vite · full-stack development ·
data visualization (WebGL / 3D graphs) · UI/UX · responsive/mobile-first design ·
authentication & authorization · RBAC · privacy-by-design · application security / OWASP ·
AI/LLM integration design · prompt/intent routing · monorepo tooling · Netlify deployment ·
accessibility (WCAG 2.2 AA) · technical writing · product thinking · business case / ROI
modeling · teamwork · hackathon delivery under time constraints.

---

## Honest scoping caveats (so you don't overclaim in an interview)

- This is a **proof-of-concept prototype.** It uses **mock/dummy data** and a **mock AI
  service** — there is no real database, no real LLM call, and no real integration with OPS
  systems in the delivered build. Present it as *"a working prototype and production-forward
  design,"* not a shipped production system.
- The security controls are **demonstrative** — they model the shape of real controls but the
  client-side mock backend is not a real security boundary. The value you can honestly claim
  is the *design* of a correct authz/privacy model and a documented hardening plan.
- If asked "what was real vs. mock," be ready to explain: the frontend, the REST API scaffold,
  the authorization/privacy logic, the 3D visualization, and the intent-routing engine are
  all real code; the data and the LLM are simulated.
```
