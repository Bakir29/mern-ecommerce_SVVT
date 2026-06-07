# 02 — Static Analysis & Test Plan / Test Case Design

These two activities naturally come first, before you write a single test: static analysis tells you where the risky code lives (informing *what* to test), and test design turns "we should test the cart" into concrete, executable test cases.

## Part A — Static Analysis

**Goal:** identify code quality issues, potential bugs, or vulnerabilities *without running the program*, and document what you found (and what you did about it).

### Picking a tool (match your stack)
| Stack | Tool options |
|---|---|
| JavaScript/TypeScript | ESLint (+ `eslint-plugin-security`), SonarQube/SonarCloud, TypeScript compiler strict checks |
| Python | Pylint, Flake8, Bandit (security-focused), mypy (typing) |
| Java | SonarQube/SonarLint, SpotBugs, Checkstyle, PMD |
| General/multi-language | SonarCloud (free for public repos), CodeQL (via GitHub Advanced Security / GitHub Actions) |

SonarCloud is a strong default if your repo is public — free, multi-language, integrates with GitHub, and produces shareable dashboards/screenshots (handy for the report's "Screenshots and explanations of tools used" requirement).

### What to actually do
1. Run the tool against the full codebase (or at least the parts you'll be testing/modifying).
2. **Triage the output** — static analyzers produce a lot of noise. Pick out the findings that are:
   - Genuinely concerning (security smells, null-safety issues, dead code masking bugs, overly complex functions)
   - Explainable in plain language to someone who hasn't read the code
3. **Document, for each notable finding**: file/location, what the tool flagged, why it matters, and what you did (fixed it / filed an issue / consciously left it with a justification — "this is generated code", "this is a false positive because X").
4. Take screenshots of the tool's dashboard/report — the brief explicitly calls for "Screenshots and explanations of tools used."
5. If you fix any of these findings, route them through the same issue → fix → commit pipeline as bugs (see [`04_Bug_Tracking_and_Fixes.md`](04_Bug_Tracking_and_Fixes.md)) — static analysis findings are some of the easiest "bugs" to document well, since the tool already gives you a clear description and location.

### Definition of done
- A short static-analysis section/sub-report: tool name + config, summary counts (e.g., "X issues: Y critical, Z minor"), a handful of concretely explained findings with screenshots, and what you did about each.

## Part B — Test Plan & Test Case Design

**Goal:** a written test plan that defines scope and environment, plus a set of *designed* test cases using recognized techniques — this is the document you'll execute against in [`03_Test_Execution.md`](03_Test_Execution.md).

### 1. Scope section
Mirror the structure the example report used (`2.1. Scope`):
- List the major features/flows of the app.
- For each, a one- or two-line justification of *why* it matters to users (this becomes the "why we tested this" narrative in your report).
- **Explicitly state what's out of scope and why.** Common, defensible exclusions: third-party payment processing, OAuth login via external providers, anything requiring paid API keys, features that are clearly unfinished/disabled in the source. Stating this upfront (like the example's payment-testing exclusion) reads as professional scoping, not as a gap.

### 2. Testing environment & tools section
List concretely (this becomes part of your report's methodology):
- IDE / build tool (IntelliJ+Maven, VS Code+npm, PyCharm+pip/poetry, etc.)
- Languages & frameworks
- Unit/integration test framework (JUnit, pytest, Jest/Vitest, Mocha…)
- System/E2E framework (Selenium, Playwright, Cypress)
- Coverage tool (JaCoCo, coverage.py, Istanbul/nyc, Vitest coverage)
- Static analysis tool (from Part A)
- Where tests run (local machine, CI runner, against which environment — local/staging/hosted)

### 3. Designing test cases with formal techniques
Pick the technique that fits each kind of input/logic — and **name the technique explicitly in your test plan** (graders are checking that you applied "appropriate techniques," not just that tests exist).

#### Equivalence Partitioning (EP)
Split inputs into classes where the system *should* behave the same; pick one representative per class (plus invalid classes).
- Example: a "quantity" field on a product page → partitions: `<= 0` (invalid), `1..stock_available` (valid), `> stock_available` (invalid/out-of-stock).

#### Boundary Value Analysis (BVA)
Test at and around the edges of each partition — boundaries are where bugs cluster.
- Example: for a quantity field with stock = 10 → test `0`, `1`, `10`, `11`. For a password length rule of 8–20 chars → test `7`, `8`, `20`, `21`.

#### Decision Tables
For logic driven by *combinations* of conditions (discount rules, form validation with multiple fields, access control), enumerate condition combinations and expected outcomes in a table — this both designs the tests and documents the expected business logic.
- Example: "Apply discount" might depend on (logged in? Y/N) × (cart total ≥ threshold? Y/N) × (has promo code? Y/N) — 8 combinations, each with an expected outcome.

#### State transition / scenario-based (optional but useful for flows)
For multi-step flows (checkout, auth/session), map states and transitions (guest → logged-in → checkout → confirmation) and design tests for valid transitions *and* invalid ones (e.g., trying to check out while logged out).

### 4. Test case template
Use a consistent template across the whole project — the example report's table format (Test Name / Description / Pre-conditions / Test Steps / Test Data / Expected Result / Actual Result / Status / Notes) works well and translates directly into both your design doc and your execution log:

```markdown
**Test Name:** <short identifying name>
**Technique:** <EP | BVA | Decision Table | Scenario>
**Description:** <what this test checks and why>
**Pre-condition(s):** <state required before running>
**Test Steps:** <numbered>
**Test Data:** <concrete inputs>
**Expected Result:** <what should happen>
**Actual Result:** <filled in during execution>
**Status:** <Pass | Fail — filled in during execution>
**Notes:** <anything noteworthy, links to bug issues if it failed>
```

Designing these *before* execution (even in a spreadsheet or this markdown form) is what separates "test case design" from "writing tests as you go" — and it gives you a document you can literally hand in as part of the report's testing-strategy section.

### Definition of done
- A test plan document containing: scope (in + explicitly out), environment & tools, and a set of designed test cases (grouped by feature) each tagged with the technique used — ready to execute in the next phase.
