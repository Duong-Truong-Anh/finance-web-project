# Flowstate — Product Vision

**Document 1 of 3 · The Narrative**
*Audience: stakeholders, reviewers, anyone who needs the "why" before the "what"*
*Length target: ~5 pages*

---

## The short version

Flowstate is a personal cash flow and long-term investment simulator. You tell it what comes in and what goes out each month; it tells you what happens if you invest a slice of what's left for the next 30 years.

That description makes it sound like a hundred other apps. It isn't. The difference is in three decisions that sit under every feature, and those three decisions are what this document is about.

---

## Why this exists

Most budgeting apps answer the question *"where did my money go last month?"* That's a rearview-mirror question. It's useful, but it's not the question people actually wrestle with when they're trying to change their financial trajectory.

The question people wrestle with is: **"If I keep doing what I'm doing, where do I end up?"**

That's a forward-looking question, and it requires two things that don't usually live in the same product: honest bookkeeping of the present, and a believable simulation of the future. Flowstate puts them side by side. The month you just logged isn't a receipt — it's a seed for a 30-year projection that updates the moment you change anything.

There's a secondary reason this exists, which is that the category of "personal finance software" has developed a visual language — soft gradients, rounded cards, pastel icons, empty states with cartoon mascots — that actively works against the thing the user is trying to do. Managing money is a serious activity. The interface should respect that without being grim about it. More on this under *Design posture* below.

---

## Who we're building for

**The primary user** is someone who is financially literate enough to know what net cash flow means but not so sophisticated that they already use a spreadsheet model. They want structure, not tutorials. They resent hand-holding. They want to enter numbers quickly, see the consequences immediately, and be trusted to read a chart without having a cartoon character explain it.

**The secondary user, on the horizon, is a power user** — someone who wants keyboard shortcuts, CSV round-trips, custom categories, custom stock picks via live APIs, Monte Carlo bands instead of point estimates. This user is not our day-one target. But every architectural decision in this spec is made with the assumption that this user will arrive, and nothing in the MVP should block their path.

This is what "low floor, high ceiling" means in practice: the floor is a three-field form to log an expense. The ceiling is a keyboard-driven simulation environment. The MVP builds the floor. The architecture builds the staircase.

---

## The three decisions that shape everything

### Decision 1: Flows, not balances

The dominant mental model in this product is *flow*. Money moves from sources, through a hub (net cash flow), out to destinations (expenses, investments, leftover). This is why the headline visualization is a Sankey diagram, not a bar chart.

A bar chart answers "how much?" A Sankey answers "where does it go?" — which is the question the user is actually trying to answer when they open the app. The bar chart is available as a toggle because sometimes you just want the number. But the default view is the flow, because the flow is the insight.

This decision propagates everywhere. The data model is designed around transactions that have a source and a destination, not account balances. The projection engine models monthly contributions flowing into a portfolio, not the portfolio's snapshot value. When we eventually add "savings goals" or "debt paydown," they will also be destinations in the flow, not separate modules.

### Decision 2: Simulation is a first-class citizen, not a report

Most budgeting tools treat forecasting as a secondary feature — something buried in a "Projections" tab that shows a single line. In Flowstate, simulation is the point. The cash flow tab exists to feed the simulation tab. The simulation isn't generated once a month; it updates live as the user types.

This has a concrete engineering consequence: the projection engine must run in the browser, on every input change, in under 50 milliseconds. That rules out naive approaches (no calls to a backend to compute the projection, no blocking the main thread with a 30-year loop that hasn't been vectorized). It rules in: a pure TypeScript function, memoized, with its inputs explicitly tracked. This is covered in the architecture section of the PRD, but it's worth flagging here because it's a principle, not just a detail.

The simulation is also honest about its own uncertainty. The MVP uses a parameterized realistic model (mean return 15–20%, standard deviation drawn from real equity market data). This produces variance in the projection — the line isn't a clean exponential. The user sees a plausible future, not a marketing future. The high-ceiling version of this is Monte Carlo with percentile bands; the MVP gets us there without requiring the user to understand statistics.

### Decision 3: The interface is the argument

The aesthetic choices in this product are not decoration. They are the argument we are making to the user about what kind of activity they are engaged in.

Concretely, this means **no gradients anywhere in the product**. It means **no chromatic color at all in the MVP** — the product ships as a warm-black-on-warm-off-white monochrome, because color systems are the most common failure point for under-resourced products and because a well-executed monochrome looks more distinctive than a mediocre colorful one. It means real typographic hierarchy with **Fraunces** (a contemporary serif with genuine expressive range) used editorially for numbers and headlines, and **Outfit** (a geometric sans) used for labels and chrome — because numbers are the content and labels are the chrome, and they should not look the same. It means dense information layouts when density serves comprehension (a table of transactions should look like a table, not a list of padded cards). It means asymmetric editorial grids in the projection views, because symmetry signals "template" and asymmetry signals "someone thought about this." It means a Raycast-style command palette as a first-class input method, because power users are coming and they resent mice. It means tactile micro-interactions borrowed from Duolingo and Linear — typographic confetti when the user hits their first positive-cash-flow month, a satisfying press-down on primary buttons, a subtle shake when a form rejects input — because the product should feel physical.

It also means empty states and error states that are **specific and sourced**. An empty state doesn't say "No transactions yet! Add one to get started 🎉." It says "This month has no recorded income. Net cash flow assumes zero until you add an entry." An error doesn't say "Something went wrong." It says "The investment ratio must be between 0% and 100%. You entered 150%." This is the "honest error states" principle: every piece of copy is backed by something, came from somewhere, and is wrong by a specific reason.

---

## What "anti-AI design" actually means here

The phrase "anti-AI UI" gets thrown around casually. I want to be specific about what it means in this product, because it's a design constraint that will be invoked many times during implementation.

It does **not** mean retro, brutalist, or aggressively ugly for its own sake. It means rejecting the specific visual defaults that have become shorthand for "an AI built this":

- Purple-to-blue gradients on every button and card
- Rounded-everything, including elements that should have hard edges (tables, dividers)
- Emoji as a substitute for design
- Centered-everything layouts that treat the viewport as a poster
- Lorem-ipsum-quality empty states with cartoon illustrations
- Uniform card-based information architecture that flattens hierarchy
- Default shadcn/ui components applied without customization

And it means **embracing** the things that AI-generated designs consistently fail to do:

- Typographic voice (the product has a tone expressed through type, not copy)
- Genuine information density where density earns its keep
- Editorial layout decisions that respect reading order and emphasis
- Micro-interactions with weight and timing (Duolingo's "correct" ding, not a generic toast)
- Keyboard affordances that treat the keyboard as the primary input

The three design principles that carry this weight are covered in the PRD and the feature spec. The short version: opinionated typography (Fraunces + Outfit), editorial layout, keyboard-first interaction, no gradients, no chromatic color in the MVP (warm monochrome), tactile feedback, sourced empty states.

---

## What we're deliberately not building

**We are not building a bank integration.** Plaid and its equivalents are expensive, slow to onboard, and irrelevant to the academic deliverable. Users enter data manually or via CSV import.

**We are not building a real stock data feed in the MVP.** The 5 portfolio tickers (FPT, VIC, an S&P 500 ETF, and two US AI-leader tickers) use a parameterized return model with historically-grounded variance. A live API is noted as a high-ceiling extension, not a day-one feature.

**We are not building a mobile app.** The web product should be responsive enough to be usable on a phone for quick transaction entry, but the core experience — especially the Sankey and projection views — is designed for a laptop screen. Mobile-first would compromise the information density that the design posture depends on.

**We are not building multi-currency FX.** The user picks a currency; all transactions and projections assume that currency. Multi-currency is on the roadmap but behind a "yes, eventually" line.

**We are not building account-based authentication in the MVP.** Data lives in the browser (LocalStorage + CSV import/export). WorkOS AuthKit is the planned auth layer for the production cutover. The data layer is built behind a repository abstraction precisely so this cutover is a swap, not a rewrite.

---

## What success looks like

For the academic deliverable, success is: a working site that demonstrates the cash flow loop, the investment simulation, and the four core visualizations, and that the student can defend line-by-line when the instructor asks about calculation logic or source code.

For the product beyond the academic deliverable, success is: a user who opens the app, logs their month, sees their 30-year projection, and walks away with either a sense of control or a specific action to take. Success is not "engagement" or "daily active use." People should not be checking their financial projection every day; that would be neurotic. A monthly cadence, with real insights at each visit, is the goal.

The metric that matters most to the design team, in the absence of real analytics, is **whether the product survives the "screenshot test."** If a screenshot of Flowstate's projection view were posted on a design forum, would anyone guess it was built with AI assistance? If yes, we've failed. If people argue about the typography, we've succeeded.

---

## How to read the rest of this spec

This narrative is document 1 of 3.

**Document 2 is the PRD.** It is structured, exhaustive, and aimed at the engineering agent and the product reviewer. It covers features, data model, architecture, success metrics, and open questions. Read it when you need to know *what* is being built.

**Document 3 is the Jobs-to-be-Done + Feature Spec.** It frames each feature as a user job and specifies the feature at a level of detail that a competent engineer (human or AI) could implement without further clarification. Read it when you need to know *how* a feature should behave.

The three documents are meant to be read in order by a stakeholder reviewing the project, and in reverse order (feature spec → PRD → narrative) by an engineer who needs to contextualize a specific implementation question.