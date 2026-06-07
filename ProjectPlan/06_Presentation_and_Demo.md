# 06 — Presentation & Demo

20 of the 100 points ride on this short, final-weeks session. It's worth rehearsing properly — this is where you show (not just claim) that you understand what you did and why.

## What to cover (and roughly how to weight a ~10–15 minute slot)

1. **The project, in 1 minute** — what it is, why you picked it, link to repo + live deployment. Don't over-explain the app; it's the *testing*, not the app, that's graded.
2. **Your strategy, in 2 minutes** — scope (and what you deliberately left out, and why), tools chosen and why they fit the stack.
3. **The work, in 5–7 minutes — this is the core of the demo:**
   - Show the static analysis tool's output and one real finding
   - Show one or two designed test cases and explain the technique (BVA/EP/decision table) behind them
   - **Live (or recorded) run of part of the test suite** — unit + system tests executing, ideally showing a regression pair: a test failing pre-fix, then passing post-fix
   - Show the coverage report and explain the number
   - Walk through one bug end-to-end: issue → fix commit → before/after test result
4. **Results & lessons learned, in 2–3 minutes** — your summary numbers, what surprised you, what you'd do differently with more time.
5. **Q&A** — be ready to explain *why* you made specific choices (why this technique for this input, why this tool, why this scope cut). Examiners often probe scope decisions and "why didn't you test X" — having a ready, honest answer (as you'll already have written in your report) lands well.

## Slide deck structure (mirrors the report, condensed)
- Title (project name, your name, course)
- App overview (1 slide, mostly visual — screenshot/GIF of the app)
- Testing strategy (scope + tools — 1 slide)
- Static analysis (1 slide — tool screenshot + key finding)
- Test design techniques (1 slide — name the techniques, show one worked example each)
- Test execution results (1–2 slides — the summary numbers table, by category)
- Regression demo (1 slide setting up what you're about to show live)
- Coverage (1 slide — the number + your interpretation)
- Bug walkthrough (1 slide — issue → fix → before/after)
- Lessons learned & conclusion (1 slide)
- Links (repo, live demo, report) — keep visible/available for questions

Aim for **far more screenshots/demos than text** — slides full of bullet points reading like the report will be less convincing than watching tests actually run.

## De-risking the live demo
- **Record a backup video** of your test suite running and the app working, in case of live-demo gremlins (network issues, hosting cold-starts, flaky E2E tests). Nothing tanks a demo score like a 5-minute fight with a frozen browser.
- **Rehearse the timing** — these slots are usually tightly bounded; know which parts you'll cut if you're running long (the Q&A is not optional, the "app overview" almost always can be trimmed).
- **Pre-warm the hosted app** a few minutes before presenting if it's on a free tier prone to cold starts.
- **Have the report and repo open in tabs**, ready to jump to specific sections if asked.

## Definition of done
- [ ] Slide deck finished and saved in a shareable format (and ideally also linked/committed in the repo)
- [ ] Demo script/runbook written (what you'll show, in what order, with fallbacks)
- [ ] At least one full rehearsal run, timed
- [ ] Backup recording made
