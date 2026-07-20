---
marp: true
paginate: true
size: 16:9
title: ConnectOPS: OGT Summer 2026 Pitch
author: Jackie Liang, Richard Duc Anh Nguyen, Manraj Rakhraj, Ali Hamoudi
footer: 'ConnectOPS · Ops Got Talent · connectops.netlify.app'
---

<!--
============================================================
 SPEAKER NOTES are in HTML comments like this. Open Presenter
 View in Marp to read them while presenting.
 EXPORT:
   npx @marp-team/marp-cli ConnectOPS_Presentation.md --pdf
   npx @marp-team/marp-cli ConnectOPS_Presentation.md --pptx
 STRUCTURE: 5 clear parts, each with a divider slide.
   Part 1  The Problem
   Part 2  Our Solution
   Part 3  How the AI Works  (simple, for everyone)
   Part 4  Security & Trust  (Zero Trust, privacy by design)
   Part 5  Costs & Rollout   (affordable, planned)
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

/* Part 3: routing fan-out */
.router { display:flex; align-items:center; gap:14px; margin-top:22px; }
.rcol { flex:1; display:flex; flex-direction:column; gap:9px; }
.ritem { background:#fff; border:1.5px solid var(--line); border-left:4px solid var(--blue); border-radius:10px; padding:9px 13px; font-size:16px; color:var(--body); }
.ritem b { color:var(--ink); }
.rhub { background:var(--blue); color:#fff; border-radius:16px; padding:20px 16px; text-align:center; font-weight:800; min-width:150px; }
.rhub .rh-t { font-size:20px; letter-spacing:.06em; }
.rhub .rh-s { font-size:13px; font-weight:600; opacity:.92; margin-top:5px; }
.rarrow { color:var(--blue); font-size:32px; font-weight:800; }

/* Part 3: under-the-hood pipeline */
.pipe { display:flex; flex-direction:column; align-items:center; gap:2px; margin-top:8px; }
.pnode { width:100%; max-width:900px; border:1.5px solid var(--line); border-radius:11px; padding:7px 16px; background:#fff; }
.pnode .pt { font-weight:800; color:var(--ink); font-size:17.5px; }
.pnode .pd { color:var(--muted); font-size:14px; line-height:1.26; margin-top:2px; }
.pnode.hot { border-color:var(--blue); border-width:2px; }
.pnode.gate { border-left:5px solid var(--green); background:var(--green-bg); }
.pdown { color:var(--blue); font-size:14px; font-weight:800; line-height:1; }
.techtag { display:inline-block; background:var(--hdr); color:var(--blue-dk); font-size:12px; font-weight:700; padding:2px 8px; border-radius:5px; margin-left:8px; vertical-align:middle; }

/* Part 3: 4-role lanes */
.lanes4 { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-top:22px; }

/* Section divider (lead) slides */
section.lead { background: linear-gradient(135deg, #10233a 0%, #0a3a66 60%, #0066cc 100%); color:#eef3f8; justify-content:center; }
section.lead h1 { color:#ffffff; font-size:56px; }
section.lead h2 { color:#cfe0f5; border:none; font-size:26px; font-weight:600; }
section.lead p, section.lead li { color:#dbe6f2; }
section.lead strong { color:#ffffff; }
section.lead .rule { width:74px; height:5px; background:#4d9fff; border-radius:3px; margin:16px 0 22px; }
section.lead .part { color:#7fb2ee; font-weight:800; letter-spacing:.14em; font-size:20px; }

/* ---- Live-demo QR: big slide + per-slide corner badge ---- */
.qr-big {
  display:block; width:360px; height:360px; margin:12px auto 16px;
  background:#fff; padding:18px; border-radius:18px;
  box-shadow:0 8px 30px rgba(0,0,0,.35);
}
section::before {
  content:"connectops.netlify.app";
  position:absolute; top:14px; right:14px; z-index:100; box-sizing:border-box;
  height:74px; padding:0 14px 0 78px;
  background:#ffffff url("qr.svg") no-repeat 9px center;
  background-size:60px 60px;
  border:1px solid var(--line); border-radius:12px;
  box-shadow:0 2px 8px rgba(16,35,58,.22);
  color:var(--ink); font-family:"Segoe UI",Arial,sans-serif;
  font-size:14px; font-weight:800; letter-spacing:.01em; line-height:74px;
}
section.notag::before { content:none; background:none; border:none; box-shadow:none; }

/* ---- Compact slide (fits a tall pipe + callout) ---- */
section.dense p { margin:5px 0; }
section.dense .pipe { gap:0; margin-top:6px; }
section.dense .pnode { padding:5px 16px; }
section.dense .pnode .pd { margin-top:1px; line-height:1.22; }
section.dense .pdown { font-size:12px; }
section.dense .callout { margin-top:8px; padding:9px 16px; font-size:18px; }
</style>

<!-- ==================== TITLE ==================== -->
<!-- _class: lead notag -->
<!-- _paginate: false -->

# ConnectOPS

<div class="rule"></div>

## Find the right person, skill, and answer in **seconds, not hours.**

**Ontario Public Service · Ops Got Talent · Summer 2026**
Track 3 · Knowledge Retrieval and Information Access

Jackie Liang · Richard Duc Anh Nguyen · Manraj Rakhraj · Ali Hamoudi

<!--
Warm open. One sentence: "We built a working tool that helps any OPS employee find the right
person, skill, or answer in seconds, and you can try it yourselves whenever you like." Move on.
-->

---

<!-- ==================== SCAN TO TRY (BIG QR) ==================== -->
<!-- _class: lead notag -->
<!-- _paginate: false -->

# Try the live demo: scan to open it

<div class="rule"></div>

<img class="qr-big" src="qr.svg" alt="QR code linking to connectops.netlify.app" />

<div class="link">connectops.netlify.app</div>

<!--
Hold here a beat: "Scan this now and follow along on your own device for the rest of the talk."
Everything is live, so judges can explore in parallel. The same code sits in the corner of every
slide, so anyone can scan whenever they like.
-->

---

<!-- ==================== PART 1 DIVIDER ==================== -->
<!-- _class: lead -->
<!-- _paginate: false -->

<div class="part">PART 1</div>

# The Problem

<div class="rule"></div>

## The knowledge already exists. The **people and places** that hold it are hard to reach.

---

## Two halves of one problem

<div class="two">

<div>

### Places
The answer sits in a **system**: a ticket, ESMT, Forte, a doc.

But there are **too many**, and **no single way in.**

</div>

<div>

### People
The answer sits with a **person.**

But expertise has **no map**, and **reaching out cold takes a leap.**

</div>

</div>

<!--
This is the whole problem on one slide. Talk to each half. Left: the everyday friction of hunting
across systems that don't talk to each other, every team on a different tool, requests misrouted.
Right: the human half, in a 66,000-person service the thing you need is usually another person,
expertise is invisible, and the real blocker to reaching someone is not wanting to bother them.
Everything after this answers these two halves. ~60 seconds.
-->

---

## What it costs

<div class="two">

<div>

<span class="mega">~1.8 hrs</span>

**lost per person, every day**, hunting for information and people.
<span class="sub">Source: McKinsey knowledge-worker research</span>

</div>

<div>

### Across 66,000 staff
Even a sliver of that is **millions in lost capacity a year.**

Plus the costs that never hit the clock: **slow onboarding, weak collaboration, knowledge stuck in silos.**

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

## One place to reach it all.

---

## One app, three ways in

<div class="lanes">
  <div class="lane">
    <div class="lane-h">Ask</div>
    <div class="lane-b">Reach what the <b>systems</b> know, in plain English.</div>
  </div>
  <div class="lane">
    <div class="lane-h">Connect</div>
    <div class="lane-b">Reach the <b>people</b>, quietly and opt-in.</div>
  </div>
  <div class="lane">
    <div class="lane-h">Understand</div>
    <div class="lane-b">See <b>how the org connects</b>, for the leaders responsible for team health.</div>
  </div>
</div>

<div class="two" style="margin-top:22px;">

<div>

### Today
- Hunt across **many systems**
- The right **person is invisible**
- Data over-shared **or** out of reach

</div>

<div>

### With ConnectOPS
- **Ask once**, in one place
- **Reach the person** in a tap
- **Permission-based** by default

</div>

</div>

<!--
The mirror to the problem: Places → Ask, People → Connect, Understand zooms out for leaders, say
that mapping out loud, it's the spine of the pitch. Then the before/after: the clearest proof we
fixed the workflow itself, not just added a tool. Point left, then right. ~40 seconds.
-->

---

## Ask: reach what the systems know

Ask in plain English. It searches every approved source and hands the answer back.

- *"Who can staff a Python + Azure project?"*
- *"Who owns HDP-482?"*
- *"Who can I shadow for DevOps?"*

<!--
Answers the "places" half. They've seen it work in the demo, so keep it light: a couple of real
questions and move on. Under the hood it searches 7 projects across 5 tools (Jira, Azure DevOps,
ServiceNow, Trello, Confluence) and respects permissions, but don't belabour it. ~25 seconds.
-->

---

## Connect: reach the people

Flip on **“open to connect,”** and browse the colleagues who are open too.

- **Opt-in, on your terms.** You choose to be open, and how you'd like to meet: a **coffee, a walk, a skill exchange.**
- **These connections are yours**: a personal space to reach out, not a performance metric.

<div class="callout">

We're social by nature. Connect doesn't push people together; it just lowers the doorway, so the connections already worth making can finally happen.

</div>

<!--
Slow down here: this is the one to speak to, not read off. The other pillars show hard numbers, time
saved; this one is a deliberate leap and that's fine. The case, out loud: humans are social
creatures. For the first time in history we're surrounded by people we know almost nothing about,
and the friction of socializing with near-strangers means useful connections never form. The single
biggest blocker is not wanting to bother someone. A quiet, mutual, opt-in signal removes that
friction, and once two people connect, the upside is open-ended: mentorship, collaboration,
belonging. Keep the slide light; make the argument in person. ~60 seconds.
-->

---

## Understand: the leader's view

For the **managers and coordinators** responsible for a healthy team, and only them.

- Which teams are **connected**, and which are **cut off.**
- Where a key skill sits with **just one person.**
- Whether **new hires and co-ops** are settling in.

<div class="callout">

Built to help leaders <b>support their people</b> and get ahead of problems.

</div>

<!--
Lead with access + purpose: this is limited to the managers and coordinators responsible for team
health, and it exists to help: spot who's isolated, support co-ops settling in, catch key-person
risk before someone leaves. If a judge pushes on privacy, be honest: yes, a coordinator can see how
their own people are engaging, much like a manager already knows who's on their team; it's
access-controlled and bound to supporting people, not performance monitoring. ~45 seconds.
-->

---

<!-- ==================== PART 3 DIVIDER ==================== -->
<!-- _class: lead -->
<!-- _paginate: false -->

<div class="part">PART 3</div>

# How the AI Works

<div class="rule"></div>

## Simple to explain, and built to stay within the rules.

---

## The big picture: a smart front desk

Think of a **helpful front desk.** You ask in plain English; it works out what you need, sends it to the right place, checks your clearance, then hands you the answer.

<div class="journey">
  <div class="jbox"><div class="jn">STEP 1</div><div class="jt">Route</div><div class="jd">Works out what kind of question you asked.</div></div>
  <div class="jarrow">&rarr;</div>
  <div class="jbox"><div class="jn">STEP 2</div><div class="jt">Fetch</div><div class="jd">Sends it to the right skill and gets the real facts.</div></div>
  <div class="jarrow">&rarr;</div>
  <div class="jbox"><div class="jn">STEP 3</div><div class="jt">Filter</div><div class="jd">Keeps only what you are allowed to see.</div></div>
  <div class="jarrow">&rarr;</div>
  <div class="jbox"><div class="jn">STEP 4</div><div class="jt">Answer</div><div class="jd">Writes a short, sourced reply from that data.</div></div>
</div>

<div class="sub" style="margin-top:14px;">The next two slides zoom in on the interesting parts: the <b>routing</b> (Step 1) and what happens <b>under the hood</b> (Step 2).</div>

<!--
Walk left to right with the front-desk analogy. Keep this one deliberately simple: it is the
"anyone can follow this" slide. The depth comes on the next two. ~40 seconds.
-->

---

## Different questions, routed the right way

The **router** reads your question, works out what *kind* of request it is, and hands it to the skill built for exactly that.

<div class="router">
  <div class="rcol">
    <div class="ritem"><b>"Who knows Tableau?"</b></div>
    <div class="ritem"><b>"Who owns HDP-482?"</b></div>
    <div class="ritem"><b>"Build a team for Python + Azure"</b></div>
    <div class="ritem"><b>"What teams do data analytics?"</b></div>
    <div class="ritem"><b>"How many co-ops in Infrastructure?"</b></div>
  </div>
  <div class="rarrow">&rarr;</div>
  <div class="rhub"><div class="rh-t">ROUTER</div><div class="rh-s">detects the intent</div></div>
  <div class="rarrow">&rarr;</div>
  <div class="rcol">
    <div class="ritem">Person &amp; skill finder</div>
    <div class="ritem">Ticket &amp; project lookup</div>
    <div class="ritem">Team builder <span class="sub">(+ flags missing skills)</span></div>
    <div class="ritem">Team &amp; org navigator</div>
    <div class="ritem">Quick counts &amp; stats</div>
  </div>
</div>

<div class="sub" style="margin-top:12px;">One front door, many specialised skills behind it, so every kind of question gets handled properly.</div>

<!--
The point: it is not one giant AI guessing at everything. Different questions go to purpose-built
skills. Read a couple of examples left-to-right so people see the mapping. ~45 seconds.
-->

---

## Under the hood: how it actually finds the answer

<div class="pipe">
  <div class="pnode"><span class="pt">Your question</span><div class="pd">e.g. "Who can help on a Kubernetes project?"</div></div>
  <div class="pdown">&darr;</div>
  <div class="pnode hot"><span class="pt">Router</span><span class="techtag">intent detection</span><div class="pd">Decides which skill should handle it, and which tools it needs.</div></div>
  <div class="pdown">&darr;</div>
  <div class="pnode"><span class="pt">It picks the right tool</span><div class="pd"><b>Exact lookups</b>: a direct, read-only query to approved systems (tickets, org chart, directory).<br/><b>Fuzzy matches</b>: semantic search over an index <span class="techtag">vector database</span> so "k8s" still finds "Kubernetes", and similar skills or past problems surface.</div></div>
  <div class="pdown">&darr;</div>
  <div class="pnode gate"><span class="pt">Permission check</span><span class="techtag">role-based access</span><div class="pd">Filters the results down to what <i>you</i> are allowed to see, before anything reaches you.</div></div>
  <div class="pdown">&darr;</div>
  <div class="pnode"><span class="pt">Copilot writes the answer</span><div class="pd">A short, sourced reply. The people and project cards come straight from the real data, not invented by the AI.</div></div>
</div>

<!--
This is the "for the technical folks" slide. Two ideas to land: (1) an agent picks the right tool, and
(2) fuzzy matching uses a vector search so wording never blocks a good answer. The green box is the
trust moment: permissions are checked before you see anything. ~55 seconds.
-->

---

## Where every piece of information comes from

ConnectOPS doesn't keep a giant copy of everyone. It pulls each piece from the system that already owns it, and a few personal things only you can add.

<div class="lanes">
  <div class="lane"><div class="lane-h">Pulled from OPS systems</div><div class="lane-b">
  <b>Directory / Entra ID</b>: name, title, team, ministry, manager, email, phone<br/>
  <b>Microsoft Teams</b>: live status &amp; working hours<br/>
  <b>EWRS</b>: desk &amp; floor <span class="sub">(only if you share)</span><br/>
  <b>ESMT &amp; Forte</b>: tickets, projects, support paths
  </div></div>
  <div class="lane"><div class="lane-h">You enter yourself</div><div class="lane-b">
  Skills &amp; certifications<br/>
  Interests &amp; career goals<br/>
  What you'll mentor on<br/>
  Co-op details<br/>
  "Open for coffee" + privacy choices
  </div></div>
  <div class="lane"><div class="lane-h">The app records as you use it</div><div class="lane-b">
  Connections &amp; coffee chats<br/>
  Messages you send<br/>
  Feedback on answers<br/>
  <span class="sub">Kept in ConnectOPS's own database, with an audit log.</span>
  </div></div>
</div>

<div class="callout">

Everything from OPS systems is **read-only**: ConnectOPS looks, never changes. It's the **same directory Microsoft Teams already uses**, so there's no new master copy of staff data to maintain.

</div>

<!--
Key reassurance: we are NOT building a new master copy of staff data. We read from the systems that
already own each piece, and the personal, opt-in things (skills, availability) are yours to add.
Walk the three columns left to right. ~50 seconds.
-->

---

## How the data flows

<div class="router">
  <div class="rcol">
    <div class="ritem"><b>Directory / Entra ID</b><br/><span class="sub">who you are, org chart, contact</span></div>
    <div class="ritem"><b>Microsoft Teams</b><br/><span class="sub">live status, working hours</span></div>
    <div class="ritem"><b>EWRS</b><br/><span class="sub">desk &amp; floor (if shared)</span></div>
    <div class="ritem"><b>ESMT &amp; Forte</b><br/><span class="sub">tickets &amp; projects</span></div>
  </div>
  <div class="rarrow">&rarr;</div>
  <div class="rhub"><div class="rh-t">ConnectOPS</div><div class="rh-s">integration + permission layer<br/>+ its own database</div></div>
  <div class="rarrow">&rarr;</div>
  <div class="rcol">
    <div class="ritem"><b>You</b><br/><span class="sub">only what you are allowed to see</span></div>
  </div>
</div>

<div class="sub" style="margin-top:14px;">Read-only connectors on the left. The things you enter and the connections you make live in the database in the middle. Nothing reaches you until the permission layer has checked it, and it all stays inside the OPS tenant.</div>

<!--
The architecture in one picture: the app never has the user talk to those systems directly. It reads
through connectors, adds its own data, and gates everything through permissions. Say plainly that this
is our proposed design: the exact connectors get confirmed with the owning teams in Phase 1. ~45 seconds.
-->

---

## Who does what, and the one rule

<div class="lanes4">
  <div class="lane"><div class="lane-h">Router</div><div class="lane-b">Works out what you are asking and picks the right skill.</div></div>
  <div class="lane"><div class="lane-h">Tools + data</div><div class="lane-b">Fetch the real facts from approved systems and the search index.</div></div>
  <div class="lane"><div class="lane-h">Permission layer</div><div class="lane-b">Decides what you are allowed to see.</div></div>
  <div class="lane"><div class="lane-h">Copilot</div><div class="lane-b">Understands the wording and writes the final answer.</div></div>
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

# Security &amp; Trust

<div class="rule"></div>

## Zero Trust and privacy by design: safe enough for real OPS data.

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
- The app **never touches ESMT or Forte directly**: every request goes through a checked, read-only layer.
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

<!-- _class: dense -->

## Data protection built into every answer

Copilot never receives the full OPS database, only the **minimum, authorized** facts needed to answer your question.

<div class="pipe">
  <div class="pnode"><span class="pt">1 · Authenticate</span><span class="techtag">Entra ID</span><div class="pd">Teams signs you in with your OPS work account and issues a secure token.</div></div>
  <div class="pdown">&darr;</div>
  <div class="pnode"><span class="pt">2 · Authorize</span><span class="techtag">role-based</span><div class="pd">ConnectOPS validates the token and checks your role, organization, and data-owner permissions.</div></div>
  <div class="pdown">&darr;</div>
  <div class="pnode"><span class="pt">3 · Retrieve</span><span class="techtag">read-only</span><div class="pd">Connectors pull only the relevant records from approved systems: ESMT, Forte, the Directory.</div></div>
  <div class="pdown">&darr;</div>
  <div class="pnode gate"><span class="pt">4 · Minimize &amp; filter</span><div class="pd">Restricted fields, personal information, and unauthorized records are removed <i>before</i> any AI processing.</div></div>
  <div class="pdown">&darr;</div>
  <div class="pnode hot"><span class="pt">5 · Generate</span><span class="techtag">Microsoft Copilot</span><div class="pd">Copilot receives a small, approved set of facts and writes a grounded reply.</div></div>
  <div class="pdown">&darr;</div>
  <div class="pnode"><span class="pt">6 · Verify &amp; log</span><span class="techtag">audit</span><div class="pd">Source-backed results are shown, and the access decision is logged for audit and investigation.</div></div>
</div>

<div class="callout">

The AI **cannot bypass permissions, reach the full database, or change source-system records.**

</div>

<!--
The heart of the security story: a checked, minimize-then-generate pipeline. The green step is the
trust moment: filtering happens before Copilot ever sees anything. If asked which Copilot: Microsoft
Copilot is the OPS-approved AI; the exact service (M365 Copilot / Azure OpenAI via an approved OPS
service) is confirmed in Discovery alongside the TRA. ~55 seconds.
-->

---

## How much data does the AI actually see?

We never hand Copilot a copy of everything. We **search first, filter by permission, then give the AI only the few results that matter**: the Retrieval-Augmented Generation (RAG) pattern.

<div class="two">

<div>

### An example
If the data holds **100,000** employee and ticket records, a question like *"Who can help with Kubernetes?"* retrieves only the **5–10 best authorized matches.**

Only those results, **not the full database**, are given to Copilot.

</div>

<div>

### Why it matters
- **Security**: Copilot can't expose what it never received.
- **Privacy**: unnecessary personal data is never processed.
- **Cost**: smaller prompts use fewer tokens.

</div>

</div>

<div class="note">

We deliberately **don't** claim "Copilot sees 10% of the data"; that can't be guaranteed. The honest framing: it sees the **smallest relevant, authorized subset** for each request.

</div>

<!--
Addresses the exact whiteboard note: never promise a fixed percentage. Land RAG in one line: search,
permission-filter, then summarize. ~45 seconds.
-->

---

## Defence in depth

Security isn't one wall; it's **layers**, so no single failure exposes data.

<div class="lanes">
  <div class="lane"><div class="lane-h">Identity &amp; access</div><div class="lane-b">
  OPS account via <b>Entra ID</b>, never a personal one<br/>
  Seamless <b>SSO</b> inside Teams (no new password)<br/>
  <b>MFA</b> + Conditional Access<br/>
  Role-based, least-privilege access<br/>
  Auto-removed when a role or job changes
  </div></div>
  <div class="lane"><div class="lane-h">Hosting &amp; secrets</div><div class="lane-b">
  OPS-controlled, approved <b>Azure</b> environment<br/>
  Separate dev / test / production<br/>
  Managed identities for service access<br/>
  Keys &amp; secrets in <b>Azure Key Vault</b><br/>
  Private networking; encrypted in transit &amp; at rest
  </div></div>
  <div class="lane"><div class="lane-h">AI protection</div><div class="lane-b">
  No direct AI access to source databases<br/>
  Permission filtering <b>before</b> Copilot<br/>
  Allowlisted, read-only tools<br/>
  <b>Prompt-injection</b> detection (Prompt Shields)<br/>
  Output validation + source references
  </div></div>
</div>

<div class="sub" style="margin-top:14px;">The AI helps you <b>find</b> and <b>word</b> things; the real data and the permission rules decide what you can see.</div>

<!--
Three layers, left to right. The AI-protection column is the newest concern for a 2026 audience:
prompt injection is real, and we filter permissions before Copilot ever runs. ~50 seconds.
-->

---

## Governed, monitored, and reviewed <span class="req">Privacy · Security</span>

<div class="two">

<div>

### Monitoring &amp; response
- Log searches, permission decisions, and admin changes
- Alert on unusual access or repeated denials
- Feed security events to the approved monitoring platform
- Incident response, backup, and recovery in place
- Regular review of privileged and inactive accounts

</div>

<div>

### Privacy &amp; governance
- Collect **only** what routing and discovery need
- Optional data (like desk location) stays **off by default**
- Defined retention for chat, cache, feedback, and audit logs
- Guardrails so manager analytics **never** become performance monitoring
- Data stays in the **OPS tenant, in Canada**, not used to train the AI

</div>

</div>

<div class="callout">

Before production: **PIA, TRA, data classification, security review, and penetration testing**, plus accessibility to **AODA / WCAG 2.2 AA.**

</div>

<!--
The compliance-criterion slide. The PIA/TRA/pen-test line shows we know the real OPS gate to
production. The manager-analytics guardrail pre-empts the obvious privacy objection. ~50 seconds.
-->

---

<!-- ==================== PART 5 DIVIDER ==================== -->
<!-- _class: lead -->
<!-- _paginate: false -->

<div class="part">PART 5</div>

# Costs &amp; Rollout

<div class="rule"></div>

## Affordable, honestly estimated, and ready to plan.

---

## What it costs <span class="req">Financial feasibility</span>

| What we pay for | 3 years | Why it can trend lower |
|---|---|---|
| The team building &amp; running it | $950k | Mostly OPS staff + co-op students; people are the real cost |
| Hosting &amp; operations | $85k | Runs on Azure / GDC the OPS already owns |
| Connecting to OPS systems | $55k | Read-only connectors; no migration, no system replacement |
| Privacy, security &amp; accessibility reviews | $30k | PIA, TRA, WCAG; often handled by internal OPS teams |
| Training &amp; change management | $20k | Familiar, Teams-embedded web app |
| AI / Copilot usage | $30k | Usage-based; minimal at launch, grows only with adoption |
| Contingency (safety buffer) | $150k | Prudent public-sector budgeting |
| **Total (3 years)** | **≈ $1.32M** | **Well under the $1.5M cap** |

<div class="note">

These are **deliberately conservative** estimates, built on **generic public-sector benchmarks.** Because so much **reuses tools and licensing the OPS already owns**, the real cost most likely lands **at or below** this, leaving **clear room under the $1.5M cap**, rather than a figure scraping the ceiling.

</div>

<!-- Lead with the honest co-op framing, then the shape: people are the cost, everything else is reused, and we sit comfortably under $1.5M with real headroom, not at the ceiling. ~40 seconds. -->

---

## Why these numbers hold up

We kept the estimate **conservative on purpose**, and a lot of what makes it defensible is what we **don't** have to pay for.

<div class="two">

<div>

### What we're *not* paying for
- **No new AI platform**: Microsoft Copilot only
- **No new identity system**: reuse OPS sign-in (Entra ID)
- **No data migration**: read-only connectors
- **No replacing ESMT or Forte**: they stay the system of record
- **No contractor-heavy build**: OPS staff + co-ops

</div>

<div>

### Likely already covered by the OPS
- M365, Teams, SharePoint, Entra ID, Copilot **licensing**
- Shared **Azure / GDC** hosting and monitoring
- **Internal** PIA, TRA, and accessibility reviews

<div class="callout">

Where these are absorbed by existing OPS investments, the **real cost drops further** below our estimate.

</div>

</div>

</div>

<!-- The defensibility slide. Judges respect a team that knows what it is NOT buying. The point: our number is a conservative ceiling, and reuse of existing OPS investment pushes the true cost lower. The most fragile line is integration ($55k): if pushed, concede enterprise integrations can run higher and that is what the contingency + Discovery phase are for. ~40 seconds. -->

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

These are **illustrative, order-of-magnitude figures, not promises.** The honest truth: the real risk here isn't cost; it's **adoption.** So we assumed just **~10,000 users (about 15% of the OPS)**, embedded in Teams with sign-in they already have. Even at a **fraction** of that, the benefit still **comfortably beats** a small, bounded cost.

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

**Try it now:** <span class="link">connectops.netlify.app</span>

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
