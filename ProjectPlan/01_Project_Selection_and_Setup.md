# 01 — Project Selection, GitHub Setup, and Hosting

## 0. Decision made: mohamedsamara/mern-ecommerce

We're going with **[mohamedsamara/mern-ecommerce](https://github.com/mohamedsamara/mern-ecommerce)** (MIT license, live demo at https://mern-store-gold.vercel.app). Rationale (see `00_Master_Plan.md` §0 for the full summary):
- Local email/password auth → we control test accounts (the example report's biggest blocker doesn't apply)
- 11 data models / rich CRUD surface across buyer, seller, and admin roles
- No existing tests → clean slate to demonstrate the *entire* V&V pipeline ourselves
- Familiar stack (React/Redux + Node/Express/MongoDB), MIT licensed, deployable for free (Vercel + Render/Railway + MongoDB Atlas)

The rest of this file is general guidance for reference — skip straight to **§2 (GitHub setup)** and **§3 (Hosting)** to act on this decision.

## 1. Choosing the application (reference — already decided above)

### Hard requirements (from the brief)
- Source code must be **publicly available** (open-source license, or your own prior project).
- **Non-trivial**: more than a "Hello World" — should have multiple features, some persistent state, ideally a database/backend.
- Preferably **web-based or mobile-based**, with both a **UI and backend logic** — this gives you natural seams for unit tests (backend logic), integration tests (API ↔ DB, frontend ↔ API), and system tests (full UI flows).

### Practical filters that will save you weeks of pain
1. **You can run it locally without heroic effort.** Look for clear setup instructions, a reasonable dependency list, and a stack you already know (or are willing to learn fast — e.g., Node/Express + React, Django/Flask + a JS frontend, Spring Boot, etc.).
2. **It already has *some* test scaffolding**, or uses a mainstream framework where adding tests is well-documented (Jest for JS/React, pytest for Python, JUnit for Java/Spring). Greenfield test setup eats time you'd rather spend testing.
3. **It's deployable on a free tier.** Static frontends → GitHub Pages/Netlify/Vercel. Full-stack apps with a backend → Render/Railway/Fly.io/Vercel serverless. Confirm a free plan exists *before* committing to the project.
4. **You can fully control test accounts and data.** Avoid projects whose core flows depend on third-party services that block automation (payment gateways, OAuth-only login via Google/Facebook, CAPTCHA-protected signup) — the example report lost two test cases and an entire feature area (profile editing) to exactly this problem. If you deploy your own instance, you can usually seed your own test users and disable/replace such blockers in a test config.
5. **Size sweet spot**: big enough to be "non-trivial" (worth 10 points), small enough that you can read and understand the codebase in a few days. A project with 5–15 meaningful features/pages is plenty — you will not test all of it exhaustively, and that's fine (the example report explicitly scoped out online payments and called that decision out in the report).

### Where to look
- GitHub "Explore" / topic searches (e.g., `topic:beginner-friendly`, `topic:student-project`) for small-to-medium full-stack apps with permissive licenses (MIT, Apache-2.0, BSD).
- Course-friendly project lists (todo apps, blogs, e-commerce demos, booking systems, forums) — these map well onto classic test scenarios (CRUD, auth, search/filter, cart/checkout, etc.).
- Your own past coursework/personal projects, if they meet the "non-trivial" bar — this is explicitly allowed and saves the "learn an unfamiliar codebase" step.

### Decision record
Once you pick, write down *why* — you'll need a "Project overview and purpose" section in the final report anyway:
- Project name & original repo URL & license
- What it does, who it's for
- Why you chose it (what makes it non-trivial; what's interesting to test)
- What's explicitly **out of scope** and why (be upfront about this in the report, like the example did with online payments — graders respect a clearly justified scope cut far more than silent gaps)

## 2. Setting up the GitHub repository

The brief requires the repo to contain:
- [ ] The **original source code**, with original source & license clearly indicated (e.g., a `LICENSE` file plus a note in the README: "Forked from `<original-url>`, originally licensed under `<license>`").
- [ ] **All your modifications** — test code, bug fixes, any refactors — as normal commit history (not a single giant squash commit).
- [ ] A **detailed README** (see template below).

### Recommended workflow
1. **Fork** (if it's a GitHub project) or create a new repo and push the original code as your first commit(s), preserving attribution. Forking is cleaner for attribution and lets you reference the upstream automatically.
2. Create a clear branch/commit convention early, e.g.:
   - `main` — always green/deployable
   - feature or task branches for adding test infrastructure, writing test suites, fixing bugs
   - Commit messages that say *what* and *why* — these become evidence of "Proper Use of GitHub"
3. Use **GitHub Issues** from day one — even before you find "real" bugs, use issues to track your testing tasks (e.g., "Add unit tests for cart total calculation", "Set up JaCoCo coverage"). This builds the habit and the history graders want to see, and bug issues will slot naturally into the same system later (see [`04_Bug_Tracking_and_Fixes.md`](04_Bug_Tracking_and_Fixes.md)).
4. Set up CI early if practical (GitHub Actions running your test suite on push) — it's a strong, low-effort signal of "proper use of GitHub" and will also re-run your regression suite for you automatically.

### README template
Your README needs, at minimum:
```markdown
# <Project Name>

## Overview
What the app does, who it's for, and the problem it solves.

## Original Source & License
Forked/adapted from <original repo URL>, licensed under <license name>.
Modifications made for this course project: <one-line summary; details in CHANGELOG or commit history>.

## Live Demo
<public hosted URL>

## Tech Stack
Frontend / Backend / Database / etc.

## Running Locally
Step-by-step setup & run instructions (clone, install, env vars, start commands).

## Testing
- Testing strategy summary (see full report for details)
- How to run the test suite locally (commands)
- Tools used: <static analysis tool>, <unit test framework>, <system test framework>, <coverage tool>
- Link to the full project report

## Project Status / Known Issues
Link to open issues / known limitations discovered during testing.
```

## 1b. Concrete first steps for mern-ecommerce

1. **Fork** https://github.com/mohamedsamara/mern-ecommerce on GitHub into your own account.
2. **Clone locally** and get it running — it has Docker support (`docker-compose.yml`), which is the fastest path to a working MongoDB + server + client without installing Mongo natively. Alternatively run MongoDB locally/Atlas and use `npm run dev` in `server/` and `client/`.
3. **Run `seed:db`** (an npm script in `server/package.json`) to populate sample products/categories/brands — gives you realistic data to test against immediately instead of an empty store.
4. **Create your own test accounts** via `/register` (buyer), and check how to promote a user to merchant/admin (likely via the seed script or directly in MongoDB) — you'll want at least one of each role for testing access control and decision-table scenarios.
5. **Decide what to do about AWS S3 / Mailchimp / Mailgun.** Options: (a) set up free-tier accounts for these services, (b) find/add local stub implementations for the test environment, or (c) scope image-upload and email-sending out of automated testing and note it explicitly (a defensible call, same spirit as the example report excluding payments). Whatever you choose, write it down now — it goes straight into your report's Scope section.
6. **Add a LICENSE/attribution note** crediting the original repo and its MIT license in your fork's README before you start modifying things.

## 3. Hosting the project

### For mern-ecommerce specifically
The original author already deployed the **client** to Vercel (see the live demo URL) — `vercel.json` exists in `server/` too, so Vercel can likely host both, but a dedicated Node host is often smoother for an Express server with sockets/cron-like behavior. A solid free-tier combo:
- **Frontend (`client/`)**: Vercel or Netlify — connect it to your fork, auto-deploys on push to `main`
- **Backend (`server/`)**: Render or Railway free tier (supports long-running Node processes, env vars, and is simple to wire to GitHub)
- **Database**: MongoDB Atlas free shared cluster — swap the local Mongo connection string for the Atlas URI via environment variables (never commit it)
- **Env vars to configure on the host**: JWT secret, Mongo URI, and whatever you decided about AWS S3/Mailchimp/Mailgun in step 5 of §1b above (real keys, stubs, or disabled features)

### Choosing a host generally (match it to your stack)
- **Static frontend only** (HTML/CSS/JS, React/Vue build output): GitHub Pages, Netlify, Vercel — all free, all trivial to wire to a GitHub repo for auto-deploy on push.
- **Frontend + backend/API + DB**: Render, Railway, Fly.io, Vercel (with serverless functions), Heroku-style PaaS. Look for a free/hobby tier that supports your runtime (Node, Python, Java, etc.) and a small managed database (Postgres/MySQL free tiers are common).
- **Mobile app**: host a web/demo build if possible, or document an APK + provide a recorded walkthrough — clarify with the instructor if a "hosted mobile app" isn't feasible, since the brief leans web-first ("Preferably... web-based").

### Checklist
- [ ] App deploys from your fork's `main` branch (ideally auto-deploy on push, so "hosted = latest tested code" stays true with minimal effort)
- [ ] Public URL works from a fresh browser/incognito session (no auth walls blocking the grader from seeing it)
- [ ] Environment variables/secrets configured on the host (never commit secrets to the repo — use the host's secret/env-var manager)
- [ ] Live link added to the README
- [ ] **Before final submission**: redeploy so the hosted version reflects your final, bug-fixed, tested code — this is explicitly graded ("The hosted version should reflect the final state of the tested and validated system")

### A note on test environments vs. production
Some of your testing (especially anything destructive — creating/deleting accounts, placing orders, etc.) shouldn't run against the same instance the grader will browse. Two common patterns:
1. **Seed a dedicated test account** on the live deployment that your automated system tests use, isolated from "real" demo data.
2. **Run a separate local/staging instance for system testing**, and the public deployment purely as the showcase. If you do this, say so explicitly in the report's "Testing Environment" section (as the example report did when it described its IDE/Maven/Selenium setup) — transparency about *where* tests ran is part of good documentation.
