# OPSConnect — AI-Powered Organizational Knowledge & People-Discovery Platform

> **Also referred to as ConnectOPS in the codebase and pitch materials.** A full-stack
> AI-powered knowledge-retrieval and people-discovery web app built for the **Ontario Public
> Service (OPS)** — a ~66,000-person government organization.

---

## At a Glance

| | |
|---|---|
| **What it is** | An AI chat-first assistant + companion web app that helps a massive government organization find the right *person, skill, project/ticket context, and next step* in **seconds instead of hours**. |
| **Where it was built** | **OGT ("Ontario Got Talent" / OPS Got Talent) — Summer 2026 hackathon & student-proposal competition at the Ontario Government.** |
| **Result** | 🥉 **3rd place.** Judged on solution quality, technical execution, financial feasibility, and long-term sustainability. |
| **Team** | 4 people — Jackie Liang, Richard Duc Anh Nguyen, Manraj Rakhraj, Ali Hamoudi. |
| **Track** | Knowledge Retrieval & Information Access / Onboarding & Time-to-Productivity. |
| **Deliverable** | A fully working full-stack prototype **plus** a complete public-sector business case (cost model, ROI, security posture, rollout roadmap) **plus** a live deployed demo. |
| **Live demo** | Deployed on **Netlify** (`connectops.netlify.app`). |
| **Stack** | React 18 · TypeScript · Vite · Node.js · Express · WebGL/Three.js · npm-workspaces monorepo. |

---

## The Problem

In a large organization the knowledge already exists — but the **people and places that hold
it are hard to reach**. Staff act on partial context (a ticket number, a system name, a vague
problem) and lose time hunting across disconnected systems — ESMT, Forte, email, Teams,
SharePoint — to find the right owner, expert, or next step.

- Requests get **delayed or misrouted** when ownership is unclear.
- Some information can't be shared freely because of **privacy, security, or role**
  restrictions.
- **Quantified:** knowledge workers lose **~1.8 hrs/day (~20% of the workweek)** searching for
  information and chasing colleagues (McKinsey). Across ~66,000 OPS staff, recovering even a
  fraction of that is **millions of dollars in reclaimed capacity per year**.

OPSConnect turns that friction from **hours into seconds**.

---

## The Solution

A **Teams-native AI assistant** (plus a companion web app) built around a clear, governed
pipeline:

1. **Route** — the AI interprets the request and identifies the key entities (ticket, system,
   skill, person, team).
2. **Retrieve** — a governed, **read-only** query hits approved sources; semantic search
   handles synonyms (`k8s` → `Kubernetes`).
3. **Filter** — a **permission layer** applies role-based and data-owner rules *before
   anything is shown*.
4. **Phrase** — the AI writes a short, cited answer; **result cards render from the query, not
   from model text**.

> **Governance-first design principle:** *"The AI routes and phrases; governed queries supply
> the facts; the permission layer decides what may be shown."* The model never stores data,
> invents facts, or makes access-control decisions.

It does **not** replace the systems of record (ESMT, Forte) — it helps staff use them more
effectively.

---

## Technical Architecture

The whole system is built to be a **production-forward prototype**, not a throwaway demo. Every
mock component is abstracted behind a stable interface so it can be swapped out one piece at a
time for a real implementation.

### Layered, swappable backend

```
routes → controllers → services → data
```

- **`routes/`** — Express route definitions (chat, connect, directory, floors, messages, users).
- **`controllers/`** — request handlers that validate input and shape responses.
- **`services/`** — business logic: the mock AI service, the user service, the connect service.
- **`data/`** — an in-memory / JSON seed store structured like real relational data.

Because every layer depends only on the interface below it, each mock can be replaced without
touching the rest:

| Mock component | Production replacement | Contract that stays stable |
|---|---|---|
| `data/store.ts` (in-memory) | A real relational database | Service-layer data access |
| `services/mockAIService.ts` | **Microsoft Copilot** or a Python AI microservice | `AIReply` / `ChatResponse` shape |
| `middleware/mockAuth.ts` | **Microsoft Entra ID / Azure AD via MSAL** | `req.currentUser` identity |

### Two parallel backends (to prove the concept end-to-end)

- **Client-side mock backend** (`frontend/src/api/mockBackend.ts`) — runs entirely in the
  browser (in-memory + `localStorage`), powers the live Netlify demo with **zero infrastructure**,
  and wraps synchronous calls in promises with artificial latency so the UI *feels* like it's
  talking to a real server.
- **Express REST reference backend** (`backend/src/`) — a full "what the real server looks
  like" implementation that mirrors the same handlers and authorization policy.

The frontend API client (`frontend/src/api/client.ts`) is the single seam both backends share,
so the same UI can run against either.

---

## The AI Layer

A **mock AI service** simulates an LLM: it parses queries for keywords and intents (skills,
departments, names, ticket/system references) and returns **realistic, cited, explainable**
responses. It's deliberately designed so it can be swapped for **Microsoft Copilot** later
*without changing the response contract*.

**It handles 9+ distinct intent types:**

1. **Person lookup** — "Tell me about [person]."
2. **Project / ticket intelligence** — look up a specific ticket by ID or browse the active
   portfolio, ranked by priority (Critical → Low).
3. **Skill discovery** — generic skill queries across a known keyword vocabulary (Python, data
   analytics, Tableau, ML, DevOps, cybersecurity, accessibility, React, cloud, Azure,
   Kubernetes, GIS, SQL, policy, environmental, …).
4. **Team discovery** — "What teams work on [skill]?"
5. **Project staffing with capability-gap detection** — maps a project's required skills to
   internal people, one best-fit person per skill, and explicitly reports **covered skills vs.
   gap skills** (the capabilities with no internal match).
6. **Co-op / new-hire onboarding companion** — accelerates time-to-productivity.
7. **Field / career exploration** — e.g. cybersecurity or accessibility career paths.
8. **"Shadow-a-mentor"** — surfaces people open to being shadowed.
9. **Counting queries** — e.g. "how many co-ops are there?"

**Explainability is built in, not bolted on.** Every surfaced person comes with:

- A **contextual rationale** — *why* this person was surfaced (matched skills, team, or role).
- A **deterministic confidence badge** (`high` / `medium`) — strong when there are multiple
  direct skill hits or a title/team match, otherwise a solid "good" match. **No black-box
  scoring.**

---

## Key Features

### Core member experience

- **AI chat assistant (homepage)** — conversational people/knowledge search with a sidebar of
  conversation history and inline **mini-profile cards** that explain *why* each person was
  surfaced (rationale + confidence).
- **Employee directory** — a filterable roster (department, team, location, title, ministry),
  integrated directly into the chat sidebar.
- **Profile pages** — a clean "business card" view plus extended info and **user-controlled
  privacy toggles**.
- **Connect board** — a "who's open to connect today" bulletin with low-pressure connection
  intents (coffee chat, lunch buddy, walk & talk, skill exchange, shared interest, "new
  here"), a connection concierge that drafts intros and suggests who to meet, and smart
  **proximity** ("N people near you on Floor X are open today").
- **Direct messaging** — a lightweight inbox/threads system for initial outreach (a bridge to
  Teams, not a replacement).
- **A consistent interaction pattern app-wide:** **mini card → preview card → full profile.**

### Manager / coordinator tooling *(the standout differentiator)*

- **The Connection Network** — a live, interactive **3D force-directed graph** (built with
  `react-force-graph-3d` / WebGL / Three.js) where **every employee is a node**. Users switch
  the "lens" (edge mode) — logged coffee-chat connections, same team/ministry/division, shared
  skills/interests, same project, reporting line, location, mentorship, cohort — and the whole
  visualization re-renders. It instantly surfaces:
  - **isolated or newly-arrived staff** who need a nudge,
  - informal **"connector" employees** who bridge the most ministries,
  - **single-person knowledge-dependency risks** (a skill only one person holds — a
    continuity risk).
- **Coordinator analytics page** — a leadership view readable in ~30 seconds: adoption / active
  users, cross-team & cross-ministry collaboration, most/least connected teams, knowledge
  concentration & gaps, and onboarding health for new co-ops. **Aggregate only — never
  individual surveillance.**
- **Manager chat** — plain-language analytics with no dashboards to learn: *"Who on my team is
  isolated?", "How are Priya and Marcus connected?", "Which active projects have staffing gaps,
  and who can fill them?", "Which skills do we rely on only one person for?"*

### The 3D graph, under the hood

- Nodes sized by `sqrt(degree)` and colored by ministry; dimmed when filtered out; grow and
  highlight neighbors on focus.
- The org network is built from **4 deterministic edge layers** (seeded for reproducibility):
  logged coffee chats (weighted), intra-team links, cross-team bridges, and pre-seeded hub
  connectors — producing a realistic, explorable social graph.
- Tuned D3 force physics (charge, link distance/strength, warmup/cooldown ticks) with a
  reheat-once-then-freeze strategy for a stable, performant WebGL scene.
- The manager chat and the graph are wired together: asking "find Priya" in chat animates the
  camera to that node and highlights their connections.

---

## Security & Privacy Modeling

Security was treated as a first-class design concern, with a written **Security Overview** that
is explicit about what is genuine vs. a demonstrative stand-in, and a full production-hardening
backlog.

**Authorization model (modeled correctly, even in the mock):**

- **Self-only profile edits** protected by a **field allow-list** — a proper **mass-assignment
  guard** so a user can't flip their own `isAdmin`, change their ministry, etc.
- **Admin-gated analytics** — every org-level insight, the connection graph, and the admin chat
  throw `403` unless the viewer is an admin (role assigned at seed time, never from user input).
- **Scope-isolated admin chat threads** — coordinators can't read each other's threads, and
  members never see admin threads.
- **Participant-scoped message threads** — prevents thread enumeration (IDOR).

**Privacy-by-design controls:**

- **Opt-in and reciprocal location sharing** — you can't see others' floor/seat while hiding
  your own; proximity only resolves when *both* people share.
- **Configurable message privacy** — `everyone | ministry | none`, enforced on first contact.
- **Own-profile vs. public-profile data split** — sensitive fields are stripped for anyone
  viewing someone else's profile.
- Deliberate **non-features** to avoid a surveillance feel: no building-wide "where is
  everyone" map, no "Ask AI about this person" button, no dating-app-style matching, no
  manager-visible individual activity tracking.

**Documented production hardening plan (OWASP-aware):**

- Replace mock auth entirely with **Entra ID / MSAL SSO**; validate real bearer/ID tokens
  server-side (signature, issuer, audience, expiry).
- Derive identity and role claims from the **token**, never a client header.
- **RBAC** sourced from Entra group membership instead of a hardcoded admin set.
- Real password KDF (**Argon2id / bcrypt / scrypt**) with per-user salt.
- Server-side input validation, audit logging for analytics access, and data-retention rules.

---

## The Business Case

Beyond the code, the team produced a complete public-sector business case — a major reason the
project placed at a competition that explicitly weighed **financial feasibility and long-term
sustainability**.

**Cost model** — a bottom-up, defensible 3-year budget:

- **~$1.43M total** against a **$1.5M ceiling** ($500k/yr, front-loaded: Y1 $500k · Y2 $470k ·
  Y3 $310k), leaving **~$70k headroom**.
- **~$150k (~12%) contingency**, for a **~16% total buffer** — a strong risk-management story.
- Built on **fully-loaded OPS salaries** (base × 1.40 for pension/benefits/overhead).
- Deliberately staffed with **permanent staff + co-op students** — a contractor team would cost
  **~1.4–2× more** and breach the cap (a core feasibility argument).
- **Reuse-don't-rebuild:** rides on existing OPS-approved infrastructure (Azure tenant, SSO,
  Microsoft 365 + Copilot licensing, ESMT/Forte as systems of record) — paying only marginal
  consumption.

**ROI** — deliberately conservative:

- **~$4M+/year** in reclaimed staff time at scale (~10,000 active users reclaiming ~10
  min/week ≈ 77,000 hrs/yr at ~$55/hr loaded).
- **Payback in under 6 months** at scale; **~9–10× annual return** vs. the ~$310k/yr
  steady-state run cost.
- **Sensitivity floor:** still returns **>2× total cost even at 25% of projected adoption**.

**Compliance angle:** data stays in the OPS/Canada tenant, Copilot doesn't train on OPS data,
SSO via ontario.ca identity, RBAC, audit logging, encryption in transit/at rest, **WCAG 2.2
AA** accessibility.

**4-phase rollout roadmap:** Discovery & Design → Foundation Build → Data Integration → Pilot &
Rollout, each with defined success metrics (time-to-answer from hours to <60s, ≥80% requests
resolved without re-routing, 100% grounded/cited answers).

---

## Tech Stack

**Frontend**

- React 18 + TypeScript + Vite (SPA, mobile-first responsive UI)
- React Router (client-side routing)
- `react-force-graph-3d` + Three.js (WebGL) for the interactive 3D connection graph
- Context API for auth/session, theme (light/dark), toasts, and preview-card state
- Plain CSS with custom properties for theming; **WCAG 2.2 AA** target

**Backend**

- Node.js + Express + TypeScript (REST API)
- Layered architecture (routes → controllers → services → data)
- `cors`, `morgan`; `tsx` for dev, `tsc` for build
- In-memory / JSON seed store; mock auth middleware modeling token-based identity

**AI layer**

- Mock AI service simulating an LLM (keyword/intent routing, cited & explainable responses),
  designed to be swapped for **Microsoft Copilot** without changing the response contract

**Tooling / deployment**

- **npm-workspaces monorepo** running frontend + backend together
- Vite dev proxy (`/api` → backend, no CORS config in dev)
- Deployed live via **Netlify**; presentation built with **Marp**

---

## Quantified Facts

- 🥉 **3rd place** at the OGT Summer 2026 hackathon (Ontario Government).
- **Team of 4.**
- Targets a **~66,000-employee** organization.
- **9+ AI intent types** handled by the assistant.
- **3D connection graph** with **10+ relationship "lens" modes**.
- Full-stack **TypeScript** across frontend and backend (monorepo, npm workspaces).
- **~$1.43M / 3-year** cost model with **~$4M+/yr** projected ROI and **<6-month** payback.
- Live deployed demo on **Netlify**.

---

## Skills Demonstrated

TypeScript · React · Node.js · Express · REST API design · Vite · full-stack development · data
visualization (WebGL / 3D graphs) · UI/UX · responsive / mobile-first design · authentication &
authorization · RBAC · privacy-by-design · application security / OWASP · AI/LLM integration
design · prompt/intent routing · monorepo tooling · Netlify deployment · accessibility (WCAG
2.2 AA) · technical writing · product thinking · business case / ROI modeling · teamwork ·
hackathon delivery under time constraints.

---

## Honest Scope

For interview integrity: OPSConnect is a **proof-of-concept prototype**. It uses **mock data**
and a **mock AI service** — there is no real database, no live LLM call, and no real integration
with OPS systems in the delivered build. What is **real code** is the frontend, the REST API
scaffold, the authorization/privacy logic, the 3D visualization, and the intent-routing engine.
What is **simulated** is the data and the LLM. The honest value is a *working prototype plus a
production-forward design* — and a business case complete enough to place 3rd at a government
competition.
