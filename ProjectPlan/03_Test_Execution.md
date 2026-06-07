# 03 — Test Execution: Unit, Integration, System, Regression, Coverage

This is where most of the 30 "Testing Artifacts and Execution" points come from. Treat each sub-activity as its own deliverable with its own evidence trail (test code in the repo + results/logs/screenshots in the report).

## 1. Unit Testing

**Goal:** test individual functions/components/classes in isolation.

- Pick the framework matching your stack: **JUnit** (Java), **pytest** (Python), **Jest/Vitest** (JS/TS), **Mocha/Chai** (Node).
- Target **pure logic first** — calculations, validators, formatters, business rules (cart totals, discount logic, form validation, data transformations). These are cheap to test and high-value (bugs here cause real user-facing problems).
- Mock/stub external dependencies (DB, network, time/date) so unit tests are fast and deterministic.
- Map unit tests back to your test plan's EP/BVA-designed cases where relevant — e.g., the quantity-field boundary tests from `02_...md` likely belong here if the validation is a pure function.
- Aim for meaningful tests over a high quantity of trivial ones — five tests that hit real edge cases beat fifty that just check getters/setters.

**Evidence to capture:** test file paths, a sample of test code in the report, pass/fail counts, and a short narrative of what kinds of bugs unit testing is good at catching in this codebase.

## 2. Integration Testing

**Goal:** test how components/services/layers interact — the seams where unit tests can't reach.

Common seams to target in a typical web app:
- **API ↔ Database**: does an endpoint correctly persist/retrieve/update/delete data? (CRUD round-trips)
- **Service ↔ Service**: does the order service correctly call the inventory service and handle its responses/errors?
- **Frontend ↔ Backend**: does the UI correctly send requests and render API responses (including error responses)?
- **Auth/middleware ↔ protected routes**: are permissions enforced across layers, not just in one function?

Tools: framework-native integration test support (Spring Boot Test + Testcontainers/H2, Django's `TestCase` + test DB, supertest for Express/Node APIs, pytest with a test database fixture). Use a **disposable test database** (in-memory, Dockerized, or a seeded test schema) — never run integration tests against production data.

**Evidence to capture:** which integrations you tested and why they're risky seams, sample test code, results, and at least one example of a bug that *only* an integration test (not a unit test) could have caught.

## 3. System Testing (Black-Box)

**Goal:** exercise the deployed application end-to-end, the way a real user would, without knowledge of internals.

- Tools: **Selenium WebDriver**, **Playwright**, or **Cypress** — Playwright/Cypress are generally faster to set up and more stable for modern web apps; Selenium is the most "textbook" choice (and what the example report used) and pairs naturally with JUnit if your stack is Java.
- Run these against your **hosted deployment** (or a staging copy — see the note in `01_...md` about isolating destructive tests).
- This is where your designed test cases from `02_...md` get *executed* — fill in Actual Result / Status / Notes columns for real.
- Cover the major user journeys end to end: browsing/search, core CRUD flows, auth/session handling, responsive layout (the example report tested at multiple device breakpoints — a cheap, high-value addition), and any security-adjacent checks reachable black-box (HTTPS enforcement, input sanitization in forms, etc.).
- **Expect and document automation obstacles honestly.** If a flow can't be automated (bot detection, CAPTCHA, flaky third-party widgets), say so plainly and explain the impact on scope — this is exactly what the example report did with its login flow, and it reads as maturity, not failure.

**Evidence to capture:** executed test case tables (using the template from `02_...md`, now with Actual Result/Status filled in), screenshots of key flows/failures, and a tally of pass/fail by feature area.

## 4. Regression Testing

**Goal:** demonstrate that your test suite catches (or confirms the absence of) problems when the code changes.

The cleanest way to *demonstrate* this convincingly:
1. Pick a real bug you found and fixed (see `04_Bug_Tracking_and_Fixes.md`).
2. **Run the relevant tests before the fix** → show them failing (red).
3. Apply the fix.
4. **Re-run the same tests** → show them passing (green).
5. Optionally, also re-run the *full* suite after the fix to show nothing else broke.

This before/after pair is your single strongest piece of regression-testing evidence — it's concrete, reproducible, and ties together bug-fixing, testing, and version control in one narrative. Capture console output or CI run links/screenshots for both runs.

If you set up GitHub Actions CI (recommended in `01_...md`), every push naturally re-runs your suite — point to a couple of CI run links as ongoing regression evidence across the project's lifetime, not just one cherry-picked example.

## 5. Test Coverage Analysis

**Goal:** measure how much of the code your tests actually exercise, using a tool — and discuss what the number means.

- Tools: **JaCoCo** (Java/Maven/Gradle), **coverage.py** (Python/pytest-cov), **Istanbul/nyc** or **Vitest/Jest's built-in coverage** (JS/TS).
- Run it across your unit + integration suite (system/E2E coverage is harder to instrument — it's fine to scope coverage analysis to the lower test levels and say so).
- **Don't just report a percentage — interpret it:**
  - Which modules are well-covered and why that's reassuring (core business logic, payment-adjacent code, auth)
  - Which are poorly covered and why (UI glue code, generated code, third-party wrappers, dead code surfaced by static analysis)
  - Whether the *uncovered* code is actually risky — low coverage on trivial code matters less than low coverage on critical logic
- A modest, honestly-discussed coverage number ("62% overall, 90%+ on the cart/checkout logic, lower on UI components which we covered via system tests instead") reads far better than an inflated, undiscussed one.

**Evidence to capture:** a coverage report screenshot/summary table, the overall percentage, and 3-5 sentences of genuine interpretation.

## Keeping it organized as you go

Create a consistent place in the repo for test code, mirroring your test plan's grouping by feature, e.g.:
```
/tests
  /unit/...
  /integration/...
  /system (or /e2e)/...
/coverage-reports/...   (or link to CI artifacts)
```
And keep a running **execution log** (can literally be the test plan document from `02_...md` with results filled in) — this becomes the backbone of your report's "Test Execution" section, just like the example report's section 3.
