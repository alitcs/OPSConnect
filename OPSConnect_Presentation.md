---
marp: true
paginate: true
size: 16:9
title: OPSConnect — OGT Summer 2026 Pitch
author: Jackie Liang, Richard Duc Anh Nguyen, Manraj Rakhraj, Ali Hamoudi
footer: 'OPSConnect · Ops Got Talent · opsconnectt.netlify.app'
---

<!--
============================================================
 SPEAKER NOTES are in HTML comments like this. Open Presenter
 View in Marp to read them while presenting.
 EXPORT:
   npx @marp-team/marp-cli OPSConnect_Presentation.md --pdf
   npx @marp-team/marp-cli OPSConnect_Presentation.md --pptx
 STRUCTURE: 4 clear parts, each with a divider slide.
   Part 1  The Problem
   Part 2  Our Solution
   Part 3  How the AI Works  (simple, for everyone)
   Part 4  Making It Real  (safe, affordable, planned)
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
h2 { color: var(--ink); font-size: 30px; font-weight: 700; margin: 0 0 16px;
     border-bottom: 3px solid var(--blue); padding-bottom: 8px; display: inline-block; }
h3 { color: var(--ink); font-size: 22px; font-weight: 700; margin: 10px 0 4px; }
strong { color: var(--ink); }
a { color: var(--blue); }
ul, ol { margin: 6px 0 6px 4px; }
li { margin: 6px 0; }
em { color: var(--blue-dk); font-style: italic; }
table { border-collapse: collapse; font-size: 18px; width: 100%; margin-top: 6px; }
th { background: var(--hdr); color: var(--ink); text-align: left; font-weight: 700; padding: 7px 10px; border: 1px solid var(--line); }
td { padding: 7px 10px; border: 1px solid var(--line); vertical-align: top; }
footer { color: var(--muted); font-size: 12px; }
section::after { color: var(--muted); font-size: 13px; }

.tag { display:inline-block; background:var(--blue); color:#fff; font-size:14px; font-weight:700;
       padding:3px 12px; border-radius:20px; margin-right:6px; }
.req { display:inline-block; background:var(--green-bg); color:var(--green); border:1px solid #bfe0cd;
       font-size:14px; font-weight:700; padding:3px 10px; border-radius:6px; margin-left:8px; }
.callout { border:1px solid #cfe0d6; border-left:5px solid var(--green); background:var(--green-bg);
           padding:14px 18px; border-radius:8px; margin-top:14px; font-size:21px; }
.note { border:1px solid #e2d3bd; border-left:5px solid var(--amber); background:var(--amber-bg);
        padding:14px 18px; border-radius:8px; margin-top:14px; }
.big { font-size:30px; color:var(--ink); font-weight:800; }
.mega { font-size:70px; color:var(--blue); font-weight:800; line-height:1; }
.sub { color:var(--muted); }
.two { display:grid; grid-template-columns:1fr 1fr; gap:30px; }
.script { background:var(--soft); border:1px solid var(--line); border-radius:10px; padding:16px 20px; font-size:20px; }
.link { font-size:30px; font-weight:800; color:var(--blue); }

/* 4-step flow for the AI section */
.flow { display:flex; gap:14px; margin-top:22px; }
.step { flex:1; background:var(--soft); border:1px solid var(--line); border-radius:12px; padding:18px 14px; text-align:center; }
.step .num { display:inline-grid; place-items:center; width:34px; height:34px; border-radius:50%;
             background:var(--blue); color:#fff; font-weight:800; font-size:18px; margin-bottom:10px; }
.step .st { font-weight:800; color:var(--ink); font-size:20px; margin-bottom:4px; }
.step .sd { font-size:16px; color:var(--muted); line-height:1.35; }

/* Routing diagrams */
.journey { display:flex; align-items:stretch; gap:8px; margin:24px 0 4px; }
.jbox { flex:1; border:2px solid var(--blue); border-radius:14px; background:#fff; padding:16px 12px; text-align:center; }
.jbox .jn { font-size:13px; font-weight:800; color:var(--blue); letter-spacing:.08em; }
.jbox .jt { font-size:21px; font-weight:800; color:var(--ink); margin:5px 0 4px; }
.jbox .jd { font-size:15px; color:var(--muted); line-height:1.32; }
.jarrow { align-self:center; color:var(--blue); font-size:34px; font-weight:800; line-height:1; }
.sources { margin-top:16px; background:var(--soft); border:1px solid var(--line); border-radius:12px; padding:14px 18px; text-align:center; }
.src-lbl { font-weight:700; color:var(--ink); margin-right:6px; }
.chip2 { display:inline-block; background:#fff; border:1.5px solid var(--blue); color:var(--blue-dk); font-weight:700; font-size:17px; padding:4px 13px; border-radius:20px; margin:0 5px; }
.lanes { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; margin-top:22px; }
.lane { border:1px solid var(--line); border-radius:14px; overflow:hidden; box-shadow:0 1px 3px rgba(16,35,58,.06); }
.lane-h { background:var(--blue); color:#fff; font-weight:800; font-size:19px; padding:13px 14px; text-align:center; }
.lane-b { padding:16px 18px; font-size:18px; color:var(--body); line-height:1.4; }

/* Section divider (lead) slides */
section.lead { background: linear-gradient(135deg, #10233a 0%, #0a3a66 60%, #0066cc 100%); color:#eef3f8; justify-content:center; }
section.lead h1 { color:#ffffff; font-size:56px; }
section.lead h2 { color:#cfe0f5; border:none; font-size:26px; font-weight:600; }
section.lead p, section.lead li { color:#dbe6f2; }
section.lead strong { color:#ffffff; }
section.lead .rule { width:74px; height:5px; background:#4d9fff; border-radius:3px; margin:16px 0 22px; }
section.lead .part { color:#7fb2ee; font-weight:800; letter-spacing:.14em; font-size:20px; }
</style>

<!-- ==================== TITLE ==================== -->
<!-- _class: lead -->
<!-- _paginate: false -->

# OPSConnect

<div class="rule"></div>

## Find the right person, skill, and answer in **seconds, not hours.**

**Ontario Public Service · Ops Got Talent — Summer 2026**
Track 3 · Knowledge Retrieval and Information Access

Jackie Liang · Richard Duc Anh Nguyen · Manraj Rakhraj · Ali Hamoudi

<!--
Warm open. One sentence: "We built a working tool that helps any OPS employee find the right
person, skill, or answer in seconds, and you can try it yourselves whenever you like." Move on.
-->

---

<!-- ==================== TRY IT LIVE ==================== -->
<!-- _class: lead -->

## This is not a mock-up. It is live right now.

# Try it yourself, anytime:

<div class="rule"></div>

<div class="link">opsconnectt.netlify.app</div>

Everything in this presentation is real. Open the link whenever you like and explore it at your own pace.

<!--
Plant the link early so judges can explore on their own time. Say: "It is live, here is the link,
try it whenever you like." Then move on, no live walkthrough.
-->

---

<!-- ==================== PART 1 DIVIDER ==================== -->
<!-- _class: lead -->
<!-- _paginate: false -->

<div class="part">PART 1</div>

# The Problem

<div class="rule"></div>

## Good people, good systems — but finding the right one takes too long.

---

## The everyday friction

An employee starts with **partial context**: a ticket number, a system name, or a vague problem. To act on it, they have to find the right owner, expert, or next step.

- They hunt across **ESMT, Forte, email, Teams, and SharePoint**, or ask around informally.
- Requests get **delayed or misrouted** when it is unclear who owns what.
- Every team uses a **different tool**, so just to ask one question you often have to learn *someone else's* system first.
- Some information **cannot be freely shared**, so the workarounds people use today are also a **privacy risk**.

<div class="note">

This is the exact problem the challenge describes: **scattered knowledge, inconsistent hand-offs, and limited visibility** into who owns what.

</div>

<!--
Keep it human and relatable. Everyone in the room has lived this. ~45 seconds.
-->

---

## What it costs today

<div class="two">

<div>

<span class="mega">~1.8 hrs</span>

**lost per person, every day**, searching for information and tracking down colleagues.
<span class="sub">Source: McKinsey knowledge-worker research</span>

</div>

<div>

### Across the OPS
Roughly **66,000 staff**.

Even a small slice of that lost time is **millions of dollars in recoverable capacity every year** — plus duplicated work and misrouted requests.

</div>

</div>

<!--
Land the number, then the scale. Don't rush. This is the "why it matters" moment. ~40 seconds.
-->

---

<!-- ==================== PART 2 DIVIDER ==================== -->
<!-- _class: lead -->
<!-- _paginate: false -->

<div class="part">PART 2</div>

# Our Solution

<div class="rule"></div>

## OPSConnect: one place to ask, in plain language, and get a trusted answer.

---

## What OPSConnect is

A single, secure **standalone applicaiton** you sign into with your OPS account.

- You **ask in plain language** — "who knows Tableau?", "who can staff this project?", "who owns HDP-482?"
- It **searches the approved OPS systems** for you — ESMT, Forte, the Employee Directory.
- It **recommends** the right person, team using related history and suggests next steps.
- It only shows what **you are allowed to see.**



<!--
Frame it as additive, not disruptive — that reassures a public-sector audience. ~40 seconds.
-->

---

## From today, to OPSConnect

<div class="two">

<div>

### Today
- Manual search across many systems
- Owner, expert, or path is unclear
- Sensitive data over-shared **or** unavailable
- Follow-up relies on manual messages

</div>

<div>

### With OPSConnect
- Ask once, in **one** place
- Get the **team, contact, history, and next step**
- **Permission-based** results protect restricted info
- Feedback and an audit trail improve routing over time

</div>

</div>

<!--
This is the clearest proof we fixed the workflow itself. Point left, then right. ~40 seconds.
-->

---

## What you can ask it

Any employee can ask, in plain English, questions like:

- *"Who can help on a Python, data visualization, and Azure project?"*
- *"Who could work on HDP-482?"*
- *"Tell me about Priya."*
- *"What teams work on data analytics?"*
- *"Who can I shadow for DevOps?"*
- *"Who works in cybersecurity?"*

<div class="note">

The demo app already holds **7 projects across 5 different tools** — Jira, Azure DevOps, ServiceNow, Trello, and Confluence. **You do not need to know any of them.** You ask in plain English, and OPSConnect looks across all of them for you.

</div>

<!--
Shows the breadth of what it answers and mirrors the brief's "fragmented tools" reality. Judges can
try any of these on the live link at their leisure. ~30 seconds.
-->

---

## The manager's view

Managers and coordinators get a live picture of how their people connect and where to act:

<div class="two">

<div>

### Three simple tools
- **The team map** — see how everyone connects; change the view and it redraws.
- **A quick dashboard** — adoption, cross-team links, and thin spots, readable in **30 seconds.**
- **Just ask** — plain-language questions, straight answers. Nothing to learn.

</div>

<div>

### What leaders see at a glance
- Who is **isolated** or newly arrived
- Who **bridges the most ministries** (worth keeping)
- Where a skill rests on **one person** (a real risk)
- Whether silos are **shrinking over time**

</div>

</div>

<div class="callout">

It helps managers **get ahead of problems** instead of reacting to them.

</div>

<!-- ~40 seconds. This manager view is our biggest differentiator. -->

---

<!-- ==================== PART 3 DIVIDER ==================== -->
<!-- _class: lead -->
<!-- _paginate: false -->

<div class="part">PART 3</div>

# How the AI Works

<div class="rule"></div>

## Simple to explain, and built to stay within the rules.

---

## How a question flows through OPSConnect

It works like a **helpful front desk**: it understands what you asked, looks it up, checks you are allowed to see it, then hands you the answer.

<div class="journey">
  <div class="jbox"><div class="jn">STEP 1</div><div class="jt">Understand</div><div class="jd">Copilot reads your question and picks out what matters.</div></div>
  <div class="jarrow">&rarr;</div>
  <div class="jbox"><div class="jn">STEP 2</div><div class="jt">Look it up</div><div class="jd">Searches the approved systems for the real facts.</div></div>
  <div class="jarrow">&rarr;</div>
  <div class="jbox"><div class="jn">STEP 3</div><div class="jt">Check access</div><div class="jd">Confirms what you are allowed to see.</div></div>
  <div class="jarrow">&rarr;</div>
  <div class="jbox"><div class="jn">STEP 4</div><div class="jt">Answer</div><div class="jd">Writes a short, sourced reply from that data.</div></div>
</div>

<div class="sources">
<span class="src-lbl">In Step 2 it searches (read-only):</span>
<span class="chip2">ESMT</span><span class="chip2">Forte</span><span class="chip2">Employee Directory</span>
<br/><span class="sub">It is smart about wording too, so "k8s" still finds "Kubernetes."</span>
</div>

<!--
Walk left to right through the four boxes with the front-desk analogy. Point at the sources strip:
"it goes out to the real OPS systems and brings back facts." Do not go deeper than this. ~50 seconds.
-->

---

## Who does what, and the one rule

<div class="lanes">
  <div class="lane"><div class="lane-h">Microsoft Copilot</div><div class="lane-b">Understands your question and words the answer.<br/><b>Steps 1 and 4.</b></div></div>
  <div class="lane"><div class="lane-h">The approved systems</div><div class="lane-b">Provide the real facts: people, tickets, skills.<br/><b>Step 2.</b></div></div>
  <div class="lane"><div class="lane-h">The permission layer</div><div class="lane-b">Decides what you are allowed to see.<br/><b>Step 3.</b></div></div>
</div>

<div class="callout">

**The one rule:** the AI helps you **find** things and **word** them. It never decides what you are allowed to see, and it never makes up facts. The **real data** and the **permission rules** do that.

</div>

<!--
Slow down. This split, plus the one rule, wins the compliance criterion and builds trust with a
cautious audience. Deliver the rule as your thesis. ~45 seconds.
-->

---

<!-- ==================== PART 4 DIVIDER ==================== -->
<!-- _class: lead -->
<!-- _paginate: false -->

<div class="part">PART 4</div>

# Making It Real

<div class="rule"></div>

## Safe, affordable, and ready to roll out.

---

## Safe and on-policy <span class="req">Privacy · Security · Accessibility</span>

<div class="two">

<div>

### See it for yourself
- In **Settings**, sharing your desk location is **off unless you turn it on.**
- Open the manager dashboard as a regular user, and **it will not let you in.**

</div>

<div>

### The promises behind it
- **Microsoft Copilot is the only AI**, used only to summarize and suggest.
- The app **never touches ESMT or Forte directly** — every request goes through a checked, read-only layer.
- Your data **stays in the OPS's own Microsoft environment, in Canada**, and is not used to train the AI.
- You sign in with your **normal OPS account**; everything is logged and encrypted.
- Built to be **accessible** (AODA / WCAG 2.2 AA).

</div>

</div>

<!--
Showing default-off privacy and the admin redirect in the real UI is the hardest thing to fake and
our biggest credibility win. Do it live if time allows. ~50 seconds.
-->

---

## What it costs <span class="req">Financial feasibility</span>

| What we pay for | 3 years | In plain terms |
|---|---|---|
| The team building it | $1.05M | A small team of 2 to 3, including co-op students |
| Hosting and running it | $126k | Uses tools the OPS already has |
| Connecting to OPS systems | $52k | Read-only: it can look, not change |
| Privacy, security, accessibility reviews | $34k | The proper checks before launch |
| Training and rollout | $22k | Simple, familiar web app — little to learn |
| Safety buffer | $150k | For the surprises every project has |
| **Total (3 years)** | **$1.43M** | **Under the $1.5M budget** |

<div class="note">

**A word on these numbers:** costs like these are genuinely hard to pin down up front, that is the nature of a cross-system integration in an organization this large. Treat them as **rough, directional estimates, not precise figures.** What we are confident about is the **shape**: a small team, reusing tools the OPS already owns, kept inside the $1.5M budget with a real buffer for the unknowns.

</div>

<!-- Be upfront: these are directional estimates, not exact figures. Land the shape, not the decimals: small team, reused tools, under budget with a buffer. Honesty here reads as strength. ~40 seconds. -->

---

## What it gives back

<div class="two">

<div>

<span class="mega">~$4M+</span>

**in reclaimed time each year**, on deliberately cautious math.
<span class="sub">Illustration: ~10,000 people saving 10 minutes a week ≈ 77,000 hours a year.</span>

</div>

<div>

- On these rough numbers, it pays for itself in **well under a year.**
- Fewer misrouted and duplicated requests add more on top.

<div class="note">

These are **illustrative, order-of-magnitude figures, not promises.** The real value depends on adoption we cannot predict, so we used low assumptions on purpose. The honest takeaway: even if we are **well off** and only a quarter of people use it, the benefit still **comfortably beats** the cost.

</div>

</div>

</div>

<!-- Lead with honesty: these are cautious illustrations, not guarantees. The point is the benefit dwarfs a small, bounded cost even under pessimistic assumptions. ~35 seconds. -->

---

## Our plan, and how we will measure it <span class="req">Roadmap</span>

| Phase | When | What happens |
|---|---|---|
| 1 · Plan and design | FY2026-27 | Agree data sources and privacy rules; complete the required reviews |
| 2 · Build the basics | FY2026-27 | Sign-in, the app, the plumbing; **goes live for staff** |
| 3 · Connect the data | FY2027-28 | Safely link ESMT, Forte, the Directory; build the team map and dashboard |
| 4 · Pilot and grow | FY2027-29 | Test with a few teams, improve, then roll out wider |

**We will track:** time to find the right answer (target: **under 60 seconds**), requests solved without bouncing around (**8 in 10 or better**), and answers backed by real, cited sources (**100%**).

<!-- Doing the privacy reviews first signals we understand the OPS process. Point at the targets. ~40 seconds. -->

---


<!-- ==================== THANK YOU ==================== -->
<!-- _class: lead -->
<!-- _paginate: false -->

# Thank you

<div class="rule"></div>

## Questions?

**Try it now:** <span class="link">opsconnectt.netlify.app</span>

Jackie Liang · Richard Duc Anh Nguyen · Manraj Rakhraj · Ali Hamoudi

<!--
Leave the link on screen during Q&A so judges keep exploring.
Backup facts if asked:
- Seed data: 30 core employees, 6 ministries, 7 projects, 5 ticketing systems.
- Production swap: mock AI to Copilot; mock login to Entra ID sign-in; mock store to a real database.
  The app's structure stays the same.
- Accessibility already built: live result counts announced to screen readers, reduced-motion support,
  dark mode, keyboard navigation.
-->
