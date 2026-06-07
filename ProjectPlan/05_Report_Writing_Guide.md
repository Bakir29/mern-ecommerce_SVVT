# 05 — Writing the Final Report

The brief asks for a report covering: project overview/purpose, testing strategy & methodology, summary of V&V activities, screenshots/explanations of tools, and results/conclusions/lessons learned. The example PDF (`SVVT Project Documentation-Example.pdf`) is a useful structural reference for tone and the test-case table format — but note its scope was narrower than ours (it skipped static analysis, unit/integration testing, coverage, and bug-fix commits, since it tested a third-party site it didn't own/host). Your report needs to cover *all eight* VVT activities from §2 of `00_Master_Plan.md`.

## Suggested structure

```
1. Introduction
   1.1 About the Project — what it is, original source & license, your repo & live link
   1.2 Project Functionalities (with screenshots) — brief tour of what you tested

2. Testing Strategy & Methodology
   2.1 Scope (in scope / explicitly out of scope, and why)
   2.2 Testing Environment and Tools (IDE, frameworks, static analysis tool,
       unit/integration framework, system-test framework, coverage tool, CI)
   2.3 Test Design Techniques Used (EP, BVA, decision tables — explain briefly,
       with one worked example of each)

3. Static Analysis
   3.1 Tool & configuration (with screenshot of the dashboard/report)
   3.2 Notable findings and what was done about each

4. Test Execution
   4.1 Unit Testing — approach, sample tests, results
   4.2 Integration Testing — approach, sample tests, results
   4.3 System Testing — executed test cases (using the Test Name / Description /
       Steps / Data / Expected / Actual / Status table from your test plan),
       grouped by feature, with screenshots of key flows
   4.4 Regression Testing — the before/after (red→green) story for at least one fix,
       plus CI run evidence if available
   4.5 Test Coverage Analysis — tool, overall %, breakdown, and genuine interpretation

5. Bug Reports and Fixes
   For each bug: how found → issue link → root cause → fix commit link →
   before/after test evidence. Plus a short note on any bugs found-but-not-fixed
   and why.

6. Results Summary
   A consolidated table: total tests run / passed / failed, by category
   (mirrors the example report's "Testing Summary" table in §9.1)

7. Conclusion
   7.1 Lessons Learned — what surprised you, what you'd do differently,
       what this exercise taught you about V&V in practice
   7.2 Final Thoughts on the Application's Quality — an honest, fair assessment
       (the example report's closing paragraph is a good model: balanced,
       specific, names both strengths and concrete weaknesses)
```

## Writing tips drawn from the example report's strengths

- **Be specific, not generic.** "The cart total miscalculates when a discount and a quantity > stock interact" beats "the cart has some bugs."
- **Show, don't just tell — use the test-case table format consistently.** It's scannable, professional, and doubles as your raw execution evidence.
- **Name your techniques explicitly.** Don't just write tests; say "this test was designed using boundary value analysis around the 8-character minimum password length."
- **Own your scope decisions.** A clearly justified exclusion ("we excluded payment testing because X") reads as professional judgment. An unexplained gap reads as an oversight.
- **End with an honest, balanced verdict.** The example's final paragraph names specific bugs, acknowledges what worked well, and gives a clear overall impression — that balance (not just "everything passed!" or "it's all broken") is what "lessons learned/conclusions" is actually asking for.
- **Use real numbers.** "53 tests, 51 passed, 2 failed (linked below)" is concrete and credible; "most tests passed" is not.

## Practical production tips
- Write incrementally as you complete each phase — don't try to reconstruct the whole story from memory in week 8. Your test plan doc, execution logs, and issue/commit links are your raw material; the report assembles and narrates them.
- Keep a running folder of screenshots (tool dashboards, key UI flows, before/after test runs) tagged by section — assembling the final PDF becomes a layout task, not a scramble for evidence.
- Export to PDF from whatever you draft in (Word, Google Docs, LaTeX, even a styled Markdown → PDF pipeline) — make sure tables and screenshots survive the export legibly; check page breaks inside test-case tables (the example PDF has a few awkwardly split tables — avoid that by checking your own export).
- Proofread the README and report together — they should tell a consistent story (same scope, same tools, same live link).
