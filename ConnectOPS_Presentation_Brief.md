# ConnectOPS — Presentation Brief

## The One-Liner
ConnectOPS is a secure, permission-based discovery and routing layer over approved OPS data sources, powered by Microsoft Copilot. It helps staff find the right person, skill, project/ticket context, and next step in **seconds instead of hours**.

## The Problem
OPS staff act on partial context — a ticket number, a system name, a deployment key, or a vague problem — and lose time hunting across **ESMT, Forte, email, Teams, and SharePoint** to find the right owner, expert, or next step.
- Requests get delayed or misrouted when ownership is unclear.
- Some info can't be freely shared due to privacy/security/role restrictions.
- **Quantified:** Knowledge workers spend ~1.8 hrs/day (~20% of the workweek) searching for info and chasing colleagues (McKinsey). Across ~66,000 OPS staff, recovering even a fraction = millions in reclaimed capacity per year.

## The Solution
One **Teams-native assistant** (plus a companion web app) that:
1. **Routes** — Copilot interprets the request and identifies key items (ticket, system, skill, person, team).
2. **Retrieves** — a governed, read-only query hits approved sources; semantic search handles synonyms ("k8s" → "Kubernetes").
3. **Filters** — a **permission layer** applies role-based and data-owner rules *before anything is shown*.
4. **Phrases** — Copilot writes a short, cited answer; result cards render from the query, not from model text.

**Key governance principle:** *The AI routes and phrases; governed queries supply the facts; the permission layer decides what may be shown.* The model never stores data, invents facts, or makes access decisions.

It does **not** replace ESMT or Forte — it helps staff use them more effectively.

## Why It's On-Policy (compliance angle for judges)
- **Microsoft Copilot is the only AI**, used solely for summarization/recommendation.
- **Access-control decisions are made by the permission layer, never the AI model.**
- All data and inference stay in the OPS tenant (Canada); Copilot does not train on OPS data.
- Audit logging, encryption in transit/at rest, SSO via ontario.ca identity, RBAC.
- Built to **WCAG 2.2 AA**.

## Core Capabilities
| Capability | Value |
|---|---|
| Ticket & support-path discovery (ESMT, Forte) | Right owner and next step; fewer misroutes |
| Skill & expertise search | Faster problem-solving; less duplicated work |
| Project staffing & capability-gap detection | Right people on the right work; visible gaps |
| Org structure / roster / reporting-line navigation | Cross-ministry wayfinding; reduced silos |
| Co-op & new-hire onboarding companion | Faster time-to-productivity (Track 1) |

## The Manager / Coordinator Value (a strong differentiator to highlight)
Three tools turn team management from reactive to proactive:
1. **The Connection Network** — a live 3D map where every person is a node. Managers switch the "lens" (logged coffee-chat connections, same team/ministry, shared skills, same project, reporting line) and the whole picture updates. Instantly reveals isolated/newly-arrived staff, the informal connectors who bridge the most ministries, and skills that depend on a single person (a knowledge-continuity risk).
2. **The Coordinator Analytics Page** — a leadership view that reads in 30 seconds: adoption/active users, cross-team & cross-ministry collaboration, most/least connected teams, knowledge concentration & gaps, and onboarding health for new co-ops.
3. **The Manager Chat** — plain-language analytics, no dashboards to learn: *"Who on my team is isolated?" "How are Priya and Marcus connected?" "Which active projects have staffing gaps, and who can fill them?" "Which skills do we rely on only one person for?"*

## What's Deliberately NOT in It (good to preempt questions)
- No building-wide "where is everyone" map (only individual opt-in seat/floor — avoids surveillance feel).
- No "Ask AI about this person" button (browsing people ≠ investigating them).
- No dating-app-style matching/nudge mechanics.
- No manager-visible individual activity surveillance; analytics are aggregate/coordinator-gated.

## The Prototype (what you'll demo in the video)
A fully working React + TypeScript app on a mock backend (Node/Express). Live pages:
- **Chat** (homepage) — the AI assistant, sidebar conversation history, inline mini-profile cards with rationale for *why* each person was surfaced.
- **Directory** — filterable employee list (department, team, location, title).
- **Profile** — a clean "business card" (Section 1) plus extended info & privacy toggles (Section 2).
- **Messages** — lightweight direct messaging for initial outreach (a bridge to Teams, not a replacement).
- **Admin/Insights** — the 3D connection graph + coordinator analytics + manager chat.
- Universal interaction pattern everywhere: **mini card → preview card → full profile.**
- Mock AI handles 9+ intent types: person lookup, project/ticket intelligence, skill discovery, team discovery, project staffing with gap detection, co-op onboarding, cybersecurity/field exploration, shadow-a-mentor, counting queries.

## The Numbers (ROI slide)
- **3-year cost: ~$1.43M** of the $1.5M budget (~$500k/yr, front-loaded: Y1 $500k, Y2 $470k, Y3 $310k), with ~$150k (~12%) contingency.
- **Return: ~$4M+/year** in reclaimed staff time at conservative scale.
  - ~10,000 active users by FY2028-29 (~15% of OPS) reclaiming just 10 min/week ≈ 77,000 hrs/yr ≈ **$4.2M/yr** at ~$55/hr loaded.
  - Onboarding acceleration (3 fewer ramp-up days × ~2,000 new hires/co-ops) ≈ **$2M/yr** more.
- **Payback under 6 months** at scale; **~9–10x** annual return against the ~$310k/yr steady-state run cost.
- **Sensitivity:** even at 25% of projected adoption, it still returns **>2x** its total cost.
- Costed on fully-loaded OPS salaries (base × 1.40), staffed with permanent staff + co-op students (a contractor team would cost ~1.4–2x more and breach the cap).

## Implementation Roadmap
| Phase | Timeline | Focus |
|---|---|---|
| 1. Discovery & Design | FY2026-27 | Confirm data sources, permission model, success metrics; PIA & TRA |
| 2. Foundation Build | FY2026-27 | Environments, auth, frontend, API layer, DB, logging; assistant live in Teams |
| 3. Data Integration | FY2027-28 | Read-only connectors to ESMT, Forte, Directory, Copilot; connection network + analytics |
| 4. Pilot & Rollout | FY2027-29 | Validate with selected teams, improve accuracy, expand across ministries |

## Success Metrics (targets)
- Time to find correct team/contact/answer: **hours → under 60 sec**
- Requests resolved without escalation/re-routing: **≥ 80%**
- Answers grounded and cited: **100% grounded**
- New-hire time to first 10 connections: **down ≥ 50%**
- Compliance with privacy/audit/permission rules: **100%**

## Closing Recommendation
Already prototyped, staffed sustainably with OPS talent + co-op students, and funded within budget with meaningful contingency. It converts one of the OPS's most common frictions from hours into seconds. **Recommend proceeding with Phase 1 discovery, design, and pilot.**

## Project Facts (for the credits/title slide)
- **Track:** 1 — Onboarding & Time-to-Productivity (also advances Knowledge Retrieval & Request-Routing)
- **Competition:** OGT (Ops Got Talent) Summer 2026 Student Proposal, $500k/yr over 3 fiscal years
- **Team:** Jackie Liang, Richard Duc Anh Nguyen, Manraj Rakhraj, Ali Hamoudi
- **Version 1.0 — July 10, 2026**
- **Tech stack:** React + TypeScript + Vite (frontend), Node + Express + TypeScript (backend), mock AI service standing in for Microsoft Copilot
