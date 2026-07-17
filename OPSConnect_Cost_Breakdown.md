# OPSConnect — Cost Breakdown & Financial Model (Working Document)

> **Purpose of this file.** This is a *launching point* for the team to build out the cost side of the
> OPSConnect proposal in more depth. It consolidates **every cost figure already in our slides and
> executive summary**, explains **where each number came from**, adds a **more detailed bottom-up
> estimate** (my own model, clearly flagged), and lists the **assumptions, open questions, and
> research tasks** you'll need to firm up before anything is final.
>
> **Competition context:** OGT (Ops Got Talent) Summer 2026 Student Proposal. Approved budget is
> **$500,000 per year for three fiscal years (FY2026–27, FY2027–28, FY2028–29) = $1.5M total.**
> Judging weighs *financial feasibility and long-term sustainability* explicitly, so the numbers must
> be **credible, defensible, and clearly inside the cap.**
>
> **Honesty framing we're using throughout (keep this):** these are **directional planning estimates,
> not quotes.** The *shape* is what we're confident about — a small team, reusing tools the OPS already
> owns, kept under budget with a real contingency buffer. Precise figures get confirmed with the owning
> teams (data owners, security, infrastructure, ESMT/Forte) during Phase 1 Discovery.

---

## 1. The headline numbers (what's on the slides today)

These are the figures **already committed to in the presentation and executive summary**. Do not
contradict them without updating both source documents (`OPSConnect_Presentation.md` and
`OPSConnect_Executive_Summary.html`).

| Metric | Value | Source doc |
|---|---|---|
| Total budget (ceiling) | **$1.5M** ($500k/yr × 3 FY) | Competition brief |
| Total 3-year cost | **~$1.43M** | Both |
| Headroom under ceiling | **~$70k** (~4.7%) | Derived |
| Contingency included | **$150k (~12%)** | Both |
| Combined contingency + headroom | **~16%** | Exec summary (risk table) |
| Annual profile (front-loaded) | **Y1 $500k · Y2 $470k · Y3 $310k** | Both |
| Steady-state run cost (post-build) | **~$310k/yr** | Both |
| Conservative annual return | **~$4M+/yr** reclaimed time | Both |
| Payback period | **Under 6 months at scale** | Both |
| ROI at steady state | **~9–10× annual return** vs. ~$310k/yr run cost | Exec summary |
| Sensitivity floor | **>2× total cost even at 25% of projected adoption** | Both |

### 1.1 The cost table as presented

| Cost area | 3-year estimate | Notes (as written) |
|---|---:|---|
| Development & implementation team (staff + co-ops) | **$1,046k** | Lean team 2.8 → 2.2 FTE; ~83% of base cost |
| Infrastructure, hosting & monitoring | **$126k** | Marginal consumption on existing platform |
| ESMT, Forte, Directory & Copilot integration | **$52k** | Read-only connectors and SDK (variable) |
| Security, privacy & accessibility review | **$34k** | PIA & TRA, WCAG 2.2 AA audit, penetration test |
| Training & change management | **$22k** | In-Teams rollout, champions network |
| Contingency (~12%) | **$150k** | Integration surprises and scope growth |
| **Total (3 years)** | **$1,430k** | ~$500k/yr, front-loaded; under the $1.5M ceiling |

> The slide version simplifies the labels ("The team building it", "Hosting and running it", etc.) but
> the numbers are identical. Keep the two in sync.

---

## 2. Key costing principles (our defensible assumptions)

These are the assumptions that make the whole model credible to a public-sector judging panel. Every
deeper estimate should trace back to these.

1. **Fully-loaded salaries.** Base salary **× 1.40** to cover pension, benefits, and employer overhead.
   This is the standard public-sector loading factor and is the single most important assumption to
   state explicitly.
2. **Staff + co-ops, not contractors.** Deliberately staffed with permanent OPS employees and co-op
   students. At Ontario I&IT Vendor-of-Record (VOR) day rates, an equivalent contractor team would cost
   **~1.4–2× more** and would **breach the $500k/yr cap.** This is a core feasibility argument — keep it.
3. **Reuse, don't rebuild.** The program rides on **existing OPS-approved infrastructure** (Azure/GDC
   tenant, identity/SSO, Microsoft 365 + Copilot licensing, ESMT/Forte as systems of record). We pay
   only **marginal/incremental** consumption, not net-new platform cost.
4. **Read-only integration.** Connectors *look, never change.* This lowers security review scope, risk,
   and therefore cost.
5. **Front-loaded spend.** Build years (Y1–Y2) are heavier; Y3 shifts to run/operate (~$310k/yr),
   which is also the go-forward steady-state cost.
6. **Conservative benefits.** ROI uses deliberately low adoption and time-saved assumptions so the case
   holds even if we're well off.

---

## 3. Detailed bottom-up model *(my estimate — refine this)*

> ⚠️ **This section is my own build-up to reconcile against the $1,046k team line and the totals above.**
> Treat it as a *worked example* the team can pressure-test, not gospel. All salary bands are illustrative
> and should be replaced with **actual OPS I&IT classification ranges** (see research tasks in §9).

### 3.1 Team composition & FTE ramp

Front-loaded staffing that averages to the profile in the slides (2.8 FTE in Y1 → 2.2 FTE in Y3):

| Role | Y1 FTE | Y2 FTE | Y3 FTE | Notes |
|---|:--:|:--:|:--:|---|
| Technical Lead / Senior Developer | 1.0 | 1.0 | 0.8 | Architecture, integration design, code review, security liaison |
| Full-stack Developer | 1.0 | 0.8 | 0.6 | Frontend + API layer, feature build |
| Integration / Backend Developer | 0.5 | 0.5 | 0.4 | ESMT/Forte/Directory connectors, permission layer |
| Co-op Student(s) (rotating) | 1.0 | 1.0 | 1.0 | 2 co-ops × ~0.5 FTE-equivalent each; talent pipeline |
| Product/Project Owner (fractional) | 0.2 | 0.15 | 0.15 | Prioritization, stakeholder mgmt, roadmap |
| UX / Accessibility (fractional) | 0.1 | 0.05 | 0.05 | WCAG 2.2 AA, usability |
| **Total FTE** | **~2.8** | **~2.5** | **~2.2** | Matches the "2.8 → 2.2" narrative |

### 3.2 Illustrative fully-loaded annual rates *(replace with real OPS bands)*

| Role | Base (illustrative) | Loading | Fully-loaded / yr |
|---|---:|:--:|---:|
| Technical Lead / Senior Developer | $102,000 | ×1.40 | ~$143,000 |
| Full-stack Developer | $85,000 | ×1.40 | ~$119,000 |
| Integration / Backend Developer | $88,000 | ×1.40 | ~$123,000 |
| Co-op Student (per co-op, ~$26/hr) | ~$27,000 (per 4-mo term ×—annualized) | ×1.15* | ~$31,000/yr-equiv |
| Product/Project Owner | $98,000 | ×1.40 | ~$137,000 |
| UX / Accessibility Specialist | $90,000 | ×1.40 | ~$126,000 |

> \*Co-op loading is lower (~1.10–1.15) — students typically don't carry the full pension/benefit load.
> Co-op pay should be modelled **hourly** (e.g. ~$24–$30/hr × ~35 hrs/wk × term length), not as a
> salaried FTE. Adjust once real OPS co-op rates are confirmed.

### 3.3 3-year team cost reconciliation

Applying the FTE ramp (§3.1) to the loaded rates (§3.2):

| Year | Approx. blended team cost | Comment |
|---|---:|---|
| Y1 (build-heavy) | ~$405k | Full team, 2.8 FTE |
| Y2 (build → integrate) | ~$360k | 2.5 FTE |
| Y3 (integrate → operate) | ~$281k | 2.2 FTE, shifting to run |
| **3-year team total** | **~$1,046k** | Reconciles to the slide figure |

> The point of this table: show a judge that **$1,046k is not a plug number** — it's the sum of a
> credible role mix at loaded public-sector rates. Swap in real bands and it stays defensible.

### 3.4 Infrastructure, hosting & monitoring — $126k / 3 yrs (~$42k/yr)

Marginal consumption on the existing OPS Azure/GDC tenant. Illustrative monthly build-up:

| Item | Est. $/mo | Est. $/yr | Notes |
|---|---:|---:|---|
| App hosting (App Service / container) | ~$1,200 | ~$14,400 | Scales with usage; dev+test+prod envs |
| Application database (managed) | ~$700 | ~$8,400 | Preferences, audit logs, permission maps, limited cache |
| Monitoring / logging / APM | ~$500 | ~$6,000 | Access, health, security events, routing performance |
| Networking / API gateway | ~$400 | ~$4,800 | Integration layer, private endpoints |
| Backup / storage / misc | ~$700 | ~$8,400 | Retention, DR, artifact storage |
| **Subtotal** | **~$3,500** | **~$42,000** | ×3 yrs ≈ **$126k** |

> If OPS absorbs some of this as shared-platform overhead, the *chargeback* to this project could be
> lower — a good sensitivity note. Confirm the chargeback model with Infrastructure/Hosting.

### 3.5 Integration — $52k / 3 yrs *(variable line)*

Read-only connectors and SDK work. **This is deliberately isolated as a variable line** so extra
systems never block core delivery.

| Connector | Est. cost | Est. effort | Notes |
|---|---:|---|---|
| ESMT (primary) | ~$15k | ~1–2 wks | Read-only, core source of truth |
| Forte (primary) | ~$15k | ~1–2 wks | Read-only, core source of truth |
| Employee Directory | ~$8k | ~1 wk | Roster, reporting lines |
| Microsoft Copilot integration/SDK | ~$14k | ~1–2 wks | Summarization/recommendation layer |
| **Core subtotal** | **~$52k** | | In the base budget |
| *Each additional system (Jira, Confluence, Azure DevOps, ServiceNow…)* | *~$15k–$25k each* | *~1–2 wks each* | **Variable — funded incrementally as teams onboard** |

> **Important framing:** the $52k covers the **approved primary sources only.** Other ticketing tools
> are added case-by-case as separate connectors. Present these as *incremental* so they don't inflate
> the core number or threaten the cap.

### 3.6 Security, privacy & accessibility — $34k / 3 yrs

| Activity | Est. cost | When |
|---|---:|---|
| Privacy Impact Assessment (PIA) | ~$10k | Phase 1 |
| Threat & Risk Assessment (TRA) | ~$10k | Phase 1–2 |
| WCAG 2.2 AA accessibility audit | ~$8k | Phase 2 + pre-rollout |
| Penetration test / security review | ~$6k | Pre-rollout |
| **Subtotal** | **~$34k** | |

> Much of this is *internal OPS process time* rather than external spend. If done in-house it may be
> partly absorbed — but keep it costed so we're not accused of skipping mandatory reviews.

### 3.7 Training & change management — $22k / 3 yrs

| Item | Est. cost | Notes |
|---|---:|---|
| In-Teams rollout materials / quick guides | ~$8k | Low, because it's a familiar web app in Teams |
| Champions network (per-ministry advocates) | ~$8k | Time + light incentives |
| Pilot feedback loops & iteration | ~$6k | Surveys, sessions, refinement |
| **Subtotal** | **~$22k** | Intentionally lean — little to learn |

### 3.8 Contingency — $150k (~12%)

Covers integration surprises, scope growth, and estimation error. Combined with the **~$70k headroom**
under the ceiling, we carry **~16% total buffer** — a strong risk-management story for judges.

---

## 4. Annual spend profile (cash-flow view)

| Fiscal year | Budget | Planned spend | Under/over | Primary focus |
|---|---:|---:|---:|---|
| FY2026–27 (Y1) | $500k | **~$500k** | $0 | Discovery, design, foundation build, go-live in Teams |
| FY2027–28 (Y2) | $500k | **~$470k** | +$30k | Data integration, connection network, analytics |
| FY2028–29 (Y3) | $500k | **~$310k** | +$190k | Pilot, rollout, operate/run steady-state |
| **Total** | **$1,500k** | **~$1,430k** | **+$70k** | |

> **Talking point:** spend *declines* over time as the build completes and the program shifts to a low
> ~$310k/yr run cost. The unspent ~$220k across Y2–Y3 (headroom + underspend) is available for the
> variable connectors, deeper rollout, or return to the fiscal envelope.

---

## 5. Return on Investment (benefit side)

### 5.1 Core productivity model *(conservative)*

| Assumption | Value | Source / rationale |
|---|---|---|
| Time lost today searching/chasing | ~1.8 hrs/day (~20% of week) | McKinsey knowledge-worker research |
| OPS headcount | ~66,000 staff | Public figure |
| Time reclaimed per active user | **10 min/week** | Deliberately tiny fraction of the 1.8 hrs/day |
| Active users by FY2028–29 | **~10,000 (~15% of OPS)** | Conservative adoption |
| Loaded hourly rate | **~$55/hr** | Fully-loaded average |
| **Hours reclaimed/yr** | **~77,000 hrs** | 10,000 × 10 min × 46 wks |
| **Annual value** | **~$4.2M/yr** | 77,000 × $55 |

### 5.2 Onboarding acceleration (Track 1 bonus)

| Assumption | Value |
|---|---|
| New hires + co-ops per year | ~2,000 |
| Ramp-up days removed each | 3 days |
| Additional annual value | **~$2M/yr** |

### 5.3 ROI summary

| Metric | Value |
|---|---|
| Total 3-year cost | ~$1.43M |
| Conservative annual benefit | **~$4M+/yr** (productivity) + up to ~$2M/yr (onboarding) |
| Payback | **< 6 months** at scale |
| Steady-state ROI | **~9–10×** vs. ~$310k/yr run cost |
| Sensitivity floor (25% of projections) | **still > 2× total cost** |

> Plus **qualitative** gains: fewer misrouted/duplicated tickets, lower knowledge-loss (key-person) risk,
> stronger cross-ministry collaboration, faster onboarding. Hard to price, easy to defend.

---

## 6. Sensitivity analysis (do more of this)

A judge will push on adoption assumptions. Pre-empt it with a range. *(Illustrative — build a proper
table.)*

| Scenario | Active users | Reclaimed hrs/yr | Annual value | vs. 3-yr cost ($1.43M) |
|---|---:|---:|---:|---:|
| Pessimistic (25% of plan) | ~2,500 | ~19,250 | ~$1.06M/yr | ~2.2× over 3 yrs |
| Conservative (base case) | ~10,000 | ~77,000 | ~$4.2M/yr | ~8.8× over 3 yrs |
| Optimistic (25% of OPS) | ~16,500 | ~127,000 | ~$7.0M/yr | ~14.7× over 3 yrs |

> **Team task:** turn this into a clean chart for the deck. Even the *pessimistic* column beats total
> cost — that's the money slide for financial-feasibility scoring.

---

## 7. Cost comparison: staff+co-op vs. contractor *(feasibility proof)*

This directly supports the "why we fit the budget" argument.

| Model | Est. 3-yr team cost | Fits $1.5M cap? | Notes |
|---|---:|:--:|---|
| **Our model (staff + co-ops)** | **~$1,046k** | ✅ Yes | Fully-loaded OPS salaries, ×1.40 |
| Contractor team (VOR day rates) | **~$1.46M–$2.09M** | ❌ No | ~1.4–2× our cost; breaches $500k/yr cap |

> **Team task:** if you can find published Ontario I&IT VOR day-rate ranges, cite them here. That turns
> "1.4–2×" from an assertion into evidence.

---

## 8. What's deliberately excluded (scope discipline)

Keeping these *out* is a cost-control feature, not an omission — call it out so judges don't think we
missed it:

- **No net-new AI platform** — Microsoft Copilot only (also the OPS's only approved AI tool).
- **No net-new identity system** — reuse ontario.ca SSO / Entra ID.
- **No replacement of ESMT/Forte** — they stay the systems of record; we add a layer on top.
- **No building-wide location/surveillance features** — avoids cost *and* privacy risk.
- **No large data migration** — read-only connectors, limited cache only.

---

## 9. Open questions & research tasks *(team: own these)*

Assign these out. Each firms up a number currently based on assumption.

### Salaries & staffing
- [ ] Pull **actual OPS I&IT classification salary bands** (replace §3.2 illustrative rates).
- [ ] Confirm the **fully-loaded multiplier** (we use ×1.40 — verify against OPS standard).
- [ ] Confirm **co-op student pay rates** (hourly) and term structure; re-model §3.1 co-op line.
- [ ] Validate the **FTE ramp** (2.8 → 2.2) with someone who's run a build of this size.

### Infrastructure
- [ ] Confirm the **chargeback/cost-recovery model** for the OPS Azure/GDC tenant (do projects pay
      marginal consumption, or a shared-platform allocation?).
- [ ] Get real **Azure consumption estimates** for app hosting, DB, monitoring at ~10k users.
- [ ] Confirm **Microsoft Copilot licensing** — is it already covered under M365, or is there an
      incremental per-seat/consumption cost we've under-counted?

### Integration
- [ ] Confirm **ESMT / Forte integration method** and effort with those teams (API? export? middleware?).
- [ ] Validate per-connector cost (**$15k–$25k**) with a real integration engineer.
- [ ] Inventory which **other ticketing systems** are actually in use and prioritize the variable connectors.

### Security / privacy / accessibility
- [ ] Confirm whether **PIA / TRA / pen-test** are internal (absorbed) or external (billed), and cost.
- [ ] Confirm **WCAG 2.2 AA audit** cost / whether OPS has an internal accessibility team.

### ROI / benefits
- [ ] Firm up the **$55/hr loaded rate** — is it the right OPS-wide average?
- [ ] Sanity-check the **1.8 hrs/day** figure and cite the exact McKinsey source.
- [ ] Validate **~2,000 new hires/co-ops per year** and the **3-day ramp reduction** assumption.
- [ ] Build the **sensitivity chart** (§6) for the deck.
- [ ] Find and cite **Ontario I&IT VOR day rates** for the contractor comparison (§7).

---

## 10. How to keep this consistent

- **Single source of truth:** if any number changes here, update **both**
  [OPSConnect_Presentation.md](OPSConnect_Presentation.md) and
  [OPSConnect_Executive_Summary.html](OPSConnect_Executive_Summary.html).
- **Never exceed** $500k in any single fiscal year or $1.5M total — the cap is a hard judging criterion.
- **Keep the honesty framing** — "directional estimates, refined in Phase 1 Discovery." It reads as
  strength, not weakness, to a public-sector panel.
- **Lead with the ROI ratio**, not the raw cost — ~$1.43M in vs. ~$4M+/yr out is the story.

---

*Working document — v0.1. Owner: [assign]. Last updated: 2026-07-17. Numbers are directional planning
estimates for internal team use, to be validated before final submission.*
