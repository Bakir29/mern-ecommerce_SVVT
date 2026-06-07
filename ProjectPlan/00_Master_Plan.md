# 00 — Master Plan

## 0. The chosen project

**[mohamedsamara/mern-ecommerce](https://github.com/mohamedsamara/mern-ecommerce)** — a full-stack MERN (MongoDB, Express, React, Node) marketplace with three roles (buyer, seller/merchant, admin). MIT licensed, live demo at https://mern-store-gold.vercel.app, no existing test suite (we build the whole V&V pipeline from scratch).

Key facts to carry through the rest of this plan:
- **11 data models** → rich CRUD surface: `user`, `product`, `category`, `brand`, `merchant`, `cart`, `order`, `review`, `wishlist`, `address`, `contact`
- **Local email/password auth exists** (`/register`, `/login`, `/forgot`, `/reset`) independent of Google/Facebook OAuth — we fully control test accounts, so the example report's "authentication automation forbidden" trap does not apply here
- Stack: React + Redux (client), Node/Express/Mongoose (server), Docker support for local dev
- External services to plan around: AWS S3 (images), Mailchimp/Mailgun (email) — decide early whether to configure real free-tier accounts or stub these for the test environment, and document that choice in the report's scope section

## 1. What's actually being graded

The rubric (from `Project Explanation.txt`) weighs things very unevenly — plan your time accordingly:

| Criteria | Points | What this really means |
|---|---|---|
| Project Selection and Complexity | 10 | Pick something real and non-trivial, with UI + backend |
| Proper Use of GitHub | 10 | Real commit history, issues linked to fixes, clear README |
| Hosting and Accessibility | 10 | A working public URL that reflects the final, tested code |
| **Testing Artifacts and Execution** | **30** | The single biggest bucket — static analysis, test plans, unit/integration/system/regression tests, coverage, bug reports+fixes |
| Documentation and Report Quality | 20 | A well-structured report covering strategy, results, lessons learned |
| Presentation and Demo | 20 | Short live walkthrough of process and outcomes |

**Implication:** "Testing Artifacts and Execution" + "Documentation" + "Presentation" = 70/100. Most of your effort should go into *doing the testing work* and then *clearly documenting it* — not into building a fancy application. The application is a vehicle for the testing exercise, not the deliverable itself.

## 2. The eight VVT activities you must demonstrate

Straight from the brief — keep this list visible throughout the project, since each item should leave a visible artifact (a report section, a test file, a tool screenshot, a coverage number):

1. **Static Analysis** — run a linter/SAST tool, document findings
2. **Test Case Design** — a written test plan using BVA, equivalence partitioning, and/or decision tables
3. **Unit Testing** — tests for individual functions/components (JUnit, pytest, Jest, etc.)
4. **Integration Testing** — tests of components/services interacting
5. **System Testing** — black-box testing of the deployed app (e.g., Selenium/Playwright/Cypress)
6. **Regression Testing** — show that re-running tests after a code change catches/confirms behavior
7. **Test Coverage Analysis** — a coverage tool with a measured percentage and discussion
8. **Bug Reports and Fixes** — GitHub issues describing bugs you found, with commits that fix them and reference the issue number

## 3. Suggested phase order & rough timeline

Adjust dates to your semester's actual deadlines — this assumes ~8–10 weeks of effort run in parallel with other coursework.

| Phase | File | Approx. duration | Output |
|---|---|---|---|
| 1. Select & set up project | [`01_Project_Selection_and_Setup.md`](01_Project_Selection_and_Setup.md) | Week 1 | Forked repo, hosted URL, README skeleton |
| 2. Static analysis + test planning | [`02_Static_Analysis_and_Test_Design.md`](02_Static_Analysis_and_Test_Design.md) | Weeks 2–3 | Static analysis report, test plan document with designed test cases |
| 3. Test execution (unit/integration/system/regression/coverage) | [`03_Test_Execution.md`](03_Test_Execution.md) | Weeks 3–6 | Test code + execution logs + coverage reports |
| 4. Bug tracking & fixes | [`04_Bug_Tracking_and_Fixes.md`](04_Bug_Tracking_and_Fixes.md) | Ongoing from week 3, wrap up week 7 | GitHub issues + linked fix commits + before/after regression evidence |
| 5. Report writing | [`05_Report_Writing_Guide.md`](05_Report_Writing_Guide.md) | Weeks 7–8 | Final report PDF |
| 6. Presentation prep | [`06_Presentation_and_Demo.md`](06_Presentation_and_Demo.md) | Week 8–9 | Slide deck + rehearsed demo |

Note phases 2–4 overlap heavily in practice: static analysis findings often *become* bug reports; writing test cases often surfaces bugs that need fixing; fixing bugs requires regression re-runs. Don't treat them as a strict waterfall — work them together and let one feed the next.

## 4. Progress tracker

Update this checklist as you go. It mirrors the rubric so at a glance you can see what's still missing before submission.

- [ ] Application selected (non-trivial, UI + backend, source available)
- [ ] GitHub repo created with original source + license note
- [ ] App deployed to a public host; URL works and matches latest tested code
- [ ] README written (project explanation, testing strategy, run instructions, live link)
- [ ] Static analysis run and findings documented
- [ ] Test plan written (scope, environment/tools, designed test cases with BVA/EP/decision tables)
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] System (black-box) tests written and executed against the hosted deployment
- [ ] Regression test pass demonstrated after a real code change
- [ ] Coverage tool run, percentage reported and discussed
- [ ] At least a handful of real bugs filed as GitHub issues
- [ ] Each bug fixed with a commit that references its issue
- [ ] Final report drafted, reviewed, exported to PDF
- [ ] Slide deck built
- [ ] Demo rehearsed (and recorded as backup if presenting live is risky)

## 5. Key risks to plan around early

These are the things that sank parts of the example report (see its "Final Thoughts" — two failing tests were login-related because the site blocked automation) — plan around equivalents in your chosen project:

- **Pick a project where you can actually log in/interact programmatically.** If the app blocks automated logins (CAPTCHAs, bot detection), your system-testing scope shrinks drastically. Prefer projects you deploy yourself (so you control test accounts, seed data, and can disable CAPTCHAs in a test environment).
- **Pick a project with a real test setup already (or an easy one to add).** A codebase with no existing test tooling means you spend week 1 just wiring up JUnit/pytest/Jest + a coverage tool instead of testing.
- **Hosting must stay in sync with the tested code.** If you fix bugs after your last deploy, redeploy before submission — graders will compare the live site to your report.
- **Budget time for "deploy is broken" surprises.** Free hosting tiers (Render, Vercel, Netlify, Heroku-equivalents) have quirks (cold starts, env var setup, build failures). Do this in week 1, not week 8.
