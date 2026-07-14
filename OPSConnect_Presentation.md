---
marp: true
paginate: true
size: 16:9
title: OPSConnect — OGT Summer 2026 Pitch
author: Jackie Liang, Richard Duc Anh Nguyen, Manraj Rakhraj, Ali Hamoudi
footer: 'OPSConnect · Ops Got Talent · demo → opsconnect.demo'
---

<!--
============================================================
 SPEAKER NOTES LIVE IN HTML COMMENTS LIKE THIS ONE.
 In Marp preview, open Presenter View to read them.
 EXPORT:  npx @marp-team/marp-cli OPSConnect_Presentation.md --pdf
          npx @marp-team/marp-cli OPSConnect_Presentation.md --pptx
          npx @marp-team/marp-cli OPSConnect_Presentation.md --html
============================================================
-->

<style>
:root {
  --ink:#10233a; --body:#1a1a1a; --muted:#585f68; --line:#c7ccd4;
  --blue:#0066cc; --blue-dk:#0a3a66; --hdr:#edeff3; --soft:#f5f7f9;
  --green:#1d7a4d; --green-bg:#edf6f0; --amber:#a9660f; --amber-bg:#fbf4ea;
}
section {
  font-family: "Segoe UI", "Open Sans", Arial, sans-serif;
  color: var(--body); font-size: 22px; line-height: 1.45;
  padding: 54px 64px; background: #ffffff;
}
h1 { color: var(--ink); font-size: 42px; font-weight: 800; letter-spacing: -0.01em; margin: 0 0 6px; }
h2 { color: var(--ink); font-size: 30px; font-weight: 700; margin: 0 0 14px;
     border-bottom: 3px solid var(--blue); padding-bottom: 8px; display: inline-block; }
h3 { color: var(--ink); font-size: 22px; font-weight: 700; margin: 10px 0 4px; }
strong { color: var(--ink); }
a { color: var(--blue); }
ul, ol { margin: 6px 0 6px 4px; }
li { margin: 5px 0; }
em { color: var(--blue-dk); font-style: italic; }
table { border-collapse: collapse; font-size: 18px; width: 100%; margin-top: 6px; }
th { background: var(--hdr); color: var(--ink); text-align: left; font-weight: 700; padding: 7px 10px; border: 1px solid var(--line); }
td { padding: 7px 10px; border: 1px solid var(--line); vertical-align: top; }
code { background: var(--soft); color: var(--blue-dk); padding: 1px 6px; border-radius: 4px; font-size: 0.9em; }
footer { color: var(--muted); font-size: 12px; }
section::after { color: var(--muted); font-size: 13px; }

/* Accent chips + callouts */
.tag { display:inline-block; background:var(--blue); color:#fff; font-size:13px; font-weight:700;
       padding:2px 10px; border-radius:20px; margin-right:6px; letter-spacing:.02em; }
.req { display:inline-block; background:var(--green-bg); color:var(--green); border:1px solid #bfe0cd;
       font-size:13px; font-weight:700; padding:2px 9px; border-radius:5px; }
.callout { border:1px solid #cfe0d6; border-left:5px solid var(--green); background:var(--green-bg);
           padding:12px 16px; border-radius:6px; margin-top:10px; }
.note { border:1px solid #e2d3bd; border-left:5px solid var(--amber); background:var(--amber-bg);
        padding:12px 16px; border-radius:6px; margin-top:10px; }
.big { font-size:30px; color:var(--ink); font-weight:800; }
.mega { font-size:64px; color:var(--blue); font-weight:800; line-height:1; }
.sub { color:var(--muted); }
.two { display:grid; grid-template-columns:1fr 1fr; gap:26px; }
.script { background:var(--soft); border:1px solid var(--line); border-radius:8px; padding:14px 18px; font-size:19px; }
.script b { color:var(--blue-dk); }

/* Lead / section dividers */
section.lead { background: linear-gradient(135deg, #10233a 0%, #0a3a66 60%, #0066cc 100%); color:#eef3f8; justify-content:center; }
section.lead h1 { color:#ffffff; font-size:56px; }
section.lead h2 { color:#cfe0f5; border:none; font-size:26px; font-weight:600; }
section.lead p, section.lead li { color:#dbe6f2; }
section.lead strong { color:#ffffff; }
section.lead .rule { width:70px; height:5px; background:#4d9fff; border-radius:3px; margin:14px 0 20px; }

/* Demo slides */
section.demo { background: #f7fafd; border-top:10px solid var(--blue); }
section.demo h2 { color:var(--blue-dk); }
.demoflag { display:inline-block; background:var(--blue); color:#fff; font-weight:800; font-size:14px;
            padding:3px 12px; border-radius:5px; letter-spacing:.06em; }
</style>

<!-- ============================ PART 0 / TITLE ============================ -->
<!-- _class: lead -->
<!-- _paginate: false -->

# OPSConnect

<div class="rule"></div>

## Find the right person, skill, ticket context, and next step — in **seconds, not hours.**

**Ontario Public Service · Ops Got Talent — Summer 2026**
Track 1 · Onboarding & Time-to-Productivity *(also advances Knowledge Retrieval & Request-Routing)*

Jackie Liang · Richard Duc Anh Nguyen · Manraj Rakhraj · Ali Hamoudi

<!--
COLD OPEN: the video plays BEFORE this slide (chaos without the app → OPSConnect solving it).
The instant the video ends, land on this slide and say the handoff line on the next slide.
Do NOT read this slide. Let the video's energy carry into slide 2.
-->

---

<!-- ============================ THE HANDOFF ============================ -->
<!-- _class: lead -->

## You just watched the chaos. Now try the fix.

# Open it on your phone — right now.

<div class="rule"></div>

### **opsconnect.demo**  ·  *(scan the code)*

**[ QR CODE HERE ]**

Everything in the video is **live**. Follow along on your own device while we talk.

<!--
THE most important 15 seconds of the pitch. Say verbatim:
"Everything you just saw is live right now. Here's the link — open it on your phone and follow along."
Replace [ QR CODE HERE ] with a QR to the deployed demo (Netlify per netlify.toml).
Getting judges hands-on is our single biggest advantage — do it before any slides.
-->

---

<!-- ============================ PART 1 — STAKES ============================ -->

## The Problem

OPS staff act on **partial context** — a ticket number, a system name, a deployment key, a vague problem — then lose time hunting across **ESMT, Forte, email, Teams, and SharePoint** to find the right owner, expert, or next step.

- Requests get **delayed or misrouted** when ownership is unclear.
- Knowledge sits in **silos**; the same problems get re-solved.
- Some info **can't be freely shared** — so today's workarounds are also a *privacy risk*.

<div class="note">

<span class="mega">~1.8 hrs</span> lost per person **per day** searching & chasing colleagues (McKinsey) × ~66,000 OPS staff = **millions in recoverable capacity every year.**

</div>

<!--
Land the number, then the kicker: "And some of what they need, they're not even allowed to see —
so the workarounds people use today are ALSO a privacy risk." This sets up the governance win later.
Keep to ~60 seconds.
-->

---

## Before → After  <span class="req">Deliverable: Process map ✓</span>

<div class="two">

<div>

### Today
- Manual search across systems + informal asking
- Ownership / expert / support path unclear
- Sensitive data over-shared **or** unavailable
- Follow-up depends on manual messages

</div>

<div>

### With OPSConnect
- Ask in plain language in **one** place (Teams + web)
- Platform recommends **team, contact, history, next step**
- **Permission-based** results protect restricted info
- Feedback + audit trail improve routing over time

</div>

</div>

<div class="callout">

**It does not replace ESMT or Forte** — it's a governed discovery & routing layer that helps staff use them faster.

</div>

<!--
This one visual is the clearest proof we fixed the WORKFLOW (what the brief actually asks for).
Point left, point right. ~45 seconds.
-->

---

## How It Works: one disciplined loop

<span class="tag">Route</span> <span class="tag">Retrieve</span> <span class="tag">Filter</span> <span class="tag">Phrase</span>

1. **Route** — Copilot interprets the request, identifies key items (ticket, system, skill, person, team).
2. **Retrieve** — a governed, **read-only** query hits approved sources; semantic search maps *"k8s" → "Kubernetes."*
3. **Filter** — the **permission layer** applies role & data-owner rules *before anything is shown.*
4. **Phrase** — Copilot writes a short, cited answer; **result cards render from the query, not model text.**

<div class="callout">

**The principle judges remember:** *The AI routes and phrases. Governed queries supply the facts. The permission layer decides what may be shown.* The model never stores data, invents facts, or makes access decisions.

</div>

<!--
Slow down on the callout. This single principle wins the compliance criterion AND frames the innovation.
Deliver it as your thesis statement. ~45 seconds.
-->

---

<!-- ============================ LIVE DEMO 1 ============================ -->
<!-- _class: demo -->

## <span class="demoflag">LIVE DEMO 1</span>  The personal Copilot

**Switch to the live app. Run these three, in order:**

<div class="script">

1. Ask: *"I'm launching a project that needs **Python, data visualization, and Azure** — who can help?"*
   → mini-profile cards cascade in **with rationale** ("Python on Infrastructure & Cloud Ops") + match-strength ✓

2. Ask: *"Who could work on **HDP-482**?"*
   → project card shows priority, due date, **covered skills vs. staffing gaps**

3. Tap a person → **mini card → preview card → full profile.**

</div>

**Say:** *"You're all doing this too, right now, on your own device."*

<span class="req">Knowledge retrieval ✓</span> <span class="req">Request-routing ✓</span> <span class="req">Working prototype ✓</span>

<!--
Have this queued and rehearsed. Real seed data: HDP-482 = Provincial Health Analytics Dashboard,
Ministry of Health, 60% complete, needs Python/Tableau/SQL. If wifi is risky, have a screen recording fallback.
This slide proves three judging axes at once. ~2 minutes — the heart of the pitch.
-->

---

## What the assistant actually does — 9 skills

| Intent | Example query |
|---|---|
| Person lookup | *"Tell me about Priya."* |
| Project / ticket intelligence | *"Who could work on HDP-482?"* |
| Project staffing + **gap detection** | *"Build a team for Python, Tableau, Azure."* |
| Skill discovery | *"Who has Python and data-viz experience?"* |
| Team discovery | *"What teams work on data analytics?"* |
| Shadow-a-mentor | *"Who can I shadow for DevOps?"* |
| Co-op onboarding | *"I'm a new co-op — who should I meet?"* |
| Cybersecurity exploration | *"Who works in cybersecurity?"* |
| Counting / org questions | *"How many co-ops are in Infrastructure?"* |

<div class="note">

Demo data spans **7 live projects across 5 real ticketing systems** — Jira, Azure DevOps, ServiceNow, Trello, Confluence — the exact **fragmentation** the brief describes.

</div>

<!--
Don't read every row. Sweep the table, land the callout: we mirror the brief's "fragmented tools" reality.
~40 seconds.
-->

---

<!-- ============================ LIVE DEMO 2 ============================ -->
<!-- _class: demo -->

## <span class="demoflag">LIVE DEMO 2</span>  The manager's view

**Switch persona to a coordinator. In the Admin workspace:**

<div class="script">

1. **3D connection network** — flip the **lens**: coffee chats → shared skills → same project → reporting line. The whole graph re-shapes live.
2. **Ask Copilot (coordinator chat):**
   *"Which skills rely on just one person?"* → knowledge-risk list
   *"Who bridges the most ministries?"* → a node lights up on the graph

</div>

**Say:** *"Every manager gets a network analyst — spotting isolated new hires, single-person knowledge risk, and silos **before** they become problems."*

<span class="req">Innovation ✓</span> <span class="req">Decision-making & accountability ✓</span>

<!--
This is the differentiator no other team will have. 13 lenses exist; show 3-4 max.
Real questions the InsightsAssistant answers are wired up. ~1.5 minutes.
-->

---

## The manager & coordinator advantage

<div class="two">

<div>

### Three tools, one live picture
- **Connection Network** — every person a node; switch the lens, the whole org re-maps.
- **Coordinator Analytics** — adoption, cross-ministry reach, knowledge concentration; reads in **30 seconds.**
- **Manager Chat** — plain-language questions, grounded answers, **no dashboards to learn.**

</div>

<div>

### What leaders see instantly
- Who's **isolated** or newly arrived
- Who **bridges the most ministries** (retain them)
- Where a skill depends on **one person** (continuity risk)
- Whether silos are **shrinking over time**

</div>

</div>

<div class="callout">

Turns team management from **reactive to proactive** — and doubles as a change-management scorecard.

</div>

<!-- ~40 seconds. Reinforce the demo they just saw. -->

---

## Onboarding — the Track 1 win

**Demo line:** *"I'm a new co-op — who should I meet?"*

- Surfaces **mentors** with matching skills (e.g., *Angela Okafor* mentors Cloud / DevOps / Leadership)
- Surfaces **cohort peers** (e.g., *Marcus Chen*, Waterloo CS, Summer 2026)
- Coordinator can watch **onboarding health** — which co-ops are connecting vs. isolated

<div class="callout">

**Target:** new-hire time to first **10 connections down ≥ 50%.** Faster belonging → faster productivity.

</div>

<!--
Ties the demo directly back to our chosen track. Angela Okafor + Marcus Chen are real seed personas.
~40 seconds.
-->

---

<!-- ============================ PART 4 — SAFE / AFFORDABLE / REAL ============================ -->

## On-policy by design — *shown, not just claimed*  <span class="req">Privacy · Security · Accessibility ✓</span>

<div class="two">

<div>

### Demo it live
- **Settings** — seat sharing **off by default**; "who can message me" control
- Open **Admin as a non-admin** → access **blocked / redirected** (enforced in code)

</div>

<div>

### The guarantees
- **Microsoft Copilot is the only AI** — summarize & recommend only
- Access decisions in the **permission layer**, never the model
- Data stays in the **OPS tenant (Canada)**; no training on OPS data
- SSO · RBAC · audit logging · encryption
- Built to **WCAG 2.2 AA**

</div>

</div>

<!--
Showing default-off privacy + the admin redirect in the real UI is the hardest thing to fake and our
biggest credibility gain. WCAG touches already in build: aria-live result counts, reduced-motion, dark mode.
~50 seconds.
-->

---

## Cost — fits the budget on purpose  <span class="req">Financial feasibility ✓</span>

| Cost area | 3-yr | Note |
|---|---|---|
| Development team (staff + co-ops) | $1,046k | Lean 2.8 → 2.2 FTE |
| Infrastructure, hosting, monitoring | $126k | Marginal use of existing platform |
| ESMT / Forte / Directory / Copilot integration | $52k | Read-only connectors |
| Security, privacy, accessibility review | $34k | PIA, TRA, WCAG audit, pen-test |
| Training & change management | $22k | In-Teams rollout, champions |
| Contingency (~12%) | $150k | Integration surprises |
| **Total (3 yrs)** | **$1,430k** | **Y1 $500k · Y2 $470k · Y3 $310k — under the $1.5M cap** |

<div class="note">

Staffed with permanent staff + co-ops on purpose — a **contractor team would cost ~1.4–2× more and breach the cap.**

</div>

<!-- Don't read the table. Land the total and the contractor comparison. ~40 seconds. -->

---

## Return that survives scrutiny

<div class="two">

<div>

<span class="mega">~$4M+</span>
**reclaimed per year** at conservative scale
<span class="sub">~10k active users × 10 min/week ≈ 77,000 hrs/yr</span>

</div>

<div>

- Payback **under 6 months** at scale
- **~9–10×** annual return vs. ~$310k steady-state run cost
- Onboarding acceleration adds **~$2M/yr**

</div>

</div>

<div class="callout">

**The line to remember:** even at **25%** of projected adoption, OPSConnect still returns **more than 2× its total cost.** Conservative math, defensible numbers.

</div>

<!-- Conservative sensitivity reads as honesty. Emphasize the >2x floor. ~40 seconds. -->

---

## Roadmap & risk  <span class="req">Roadmap ✓</span> <span class="req">Change management ✓</span>

| Phase | Timeline | Focus |
|---|---|---|
| 1 · Discovery & Design | FY2026-27 | Data sources, permission model, metrics; **PIA & TRA** |
| 2 · Foundation Build | FY2026-27 | Auth, frontend, API, DB, logging; **assistant live in Teams** |
| 3 · Data Integration | FY2027-28 | Read-only connectors; connection network + analytics |
| 4 · Pilot & Rollout | FY2027-29 | Validate with teams, improve accuracy, expand |

| Risk | Mitigation |
|---|---|
| Low adoption | Lives **inside Teams** — no new tool to learn; champions network |
| Restricted-data exposure | Permission layer + data-owner approval + full audit logging |
| Budget overrun | Staff + co-op staffing; reuse approved platform; ~16% headroom |

<!-- Sweep both tables. PIA/TRA up front signals we know the OPS process. ~40 seconds. -->

---

<!-- ============================ PART 5 — CLOSE ============================ -->

## We met the brief

| Required deliverable | Status |
|---|---|
| Problem + proposed solution | <span class="req">✓ shown</span> |
| Current → future process map | <span class="req">✓ shown</span> |
| **Working prototype** | <span class="req">✓ you used it</span> |
| Cost-benefit analysis | <span class="req">✓ within $1.5M cap</span> |
| Rollout roadmap (phases, timelines) | <span class="req">✓ 4 phases</span> |
| Privacy · accessibility · security · change mgmt | <span class="req">✓ demonstrated in-app</span> |
| Microsoft Copilot as the only AI | <span class="req">✓ by design</span> |

<!--
This slide removes all doubt on the "did they meet requirements" judging axis.
Read down the column: "Every box — checked. And the prototype box, you checked yourselves." ~30 seconds.
-->

---

<!-- _class: lead -->

# The ask

<div class="rule"></div>

## Already prototyped — **you just used it.** Staffed sustainably. Funded within budget.

It turns one of the OPS's most common frictions **from hours into seconds.**

### **We recommend proceeding with Phase 1 — discovery, design, and pilot.**

*The version you tested today is the starting line, not the pitch.*

<!--
End on momentum. Slow, confident. Leave the demo QR up during Q&A so judges keep exploring.
-->

---

<!-- _class: lead -->
<!-- _paginate: false -->

# Thank you

<div class="rule"></div>

## Questions?

**Try it now:** opsconnect.demo   ·   **[ QR CODE ]**

Jackie Liang · Richard Duc Anh Nguyen · Manraj Rakhraj · Ali Hamoudi

<!--
Q&A backup facts if asked:
- 30 employees, 6 ministries, 7 projects, 5 ticketing systems in the seed data.
- Swap plan: mockAIService → Copilot; mockAuth → MSAL/Entra ID; store.ts → real DB. Response shapes unchanged.
- Tech: React+TS+Vite (frontend), Node+Express+TS (backend), layered routes→controllers→services→data.
- WCAG touches already built: aria-live result counts, reduced-motion handling, dark mode, keyboard nav.
-->
