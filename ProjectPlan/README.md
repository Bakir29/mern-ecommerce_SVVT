# SVVT Course Project — Working Plan

This folder is our roadmap for the Software Verification, Validation, and Testing (SVVT) course project. It breaks the official requirements (see [`../GuidelinesAndExamples/Project Explanation.txt`](../GuidelinesAndExamples/Project%20Explanation.txt)) into ordered phases, each with concrete actions, tool choices, and a definition of "done."

## How to use this folder

Read the files roughly in order — each phase builds on the previous one's output:

1. [`00_Master_Plan.md`](00_Master_Plan.md) — the big picture: phases, suggested timeline, deliverables checklist mapped to the grading rubric.
2. [`01_Project_Selection_and_Setup.md`](01_Project_Selection_and_Setup.md) — choosing a candidate application, forking/cloning it, GitHub repo hygiene, and hosting it publicly.
3. [`02_Static_Analysis_and_Test_Design.md`](02_Static_Analysis_and_Test_Design.md) — running static analysis tools and designing the test plan/test cases (boundary value analysis, equivalence partitioning, decision tables).
4. [`03_Test_Execution.md`](03_Test_Execution.md) — writing and running unit, integration, system, and regression tests, plus measuring coverage.
5. [`04_Bug_Tracking_and_Fixes.md`](04_Bug_Tracking_and_Fixes.md) — turning findings into GitHub issues, fixing them, and linking commits.
6. [`05_Report_Writing_Guide.md`](05_Report_Writing_Guide.md) — assembling the final report, using the example PDF as a style reference.
7. [`06_Presentation_and_Demo.md`](06_Presentation_and_Demo.md) — preparing the slides and live/recorded demo.

## Reference material already in the project

- [`../GuidelinesAndExamples/Project Explanation.txt`](../GuidelinesAndExamples/Project%20Explanation.txt) — the official assignment brief and grading rubric.
- [`../GuidelinesAndExamples/Project Explanation 2.txt`](../GuidelinesAndExamples/Project%20Explanation%202.txt) — a one-paragraph condensed version of the brief.
- [`../GuidelinesAndExamples/SVVT Project Documentation-Example.pdf`](../GuidelinesAndExamples/SVVT%20Project%20Documentation-Example.pdf) — a previous student's report (an e-commerce site, tested with Selenium + JUnit). Useful as a **style and structure reference** for the Test Execution and Conclusion sections — not as a template to copy, since that report focused almost entirely on black-box system testing of a third-party site and skipped the fork/host/static-analysis/unit-testing parts that *our* rubric explicitly grades.

## Where we are

Track current status in [`00_Master_Plan.md`](00_Master_Plan.md#progress-tracker) — update the checklist there as phases complete. Treat this `ProjectPlan/` folder as living documentation: edit it as decisions are made (e.g., once a project is chosen, fill in its name/repo/hosting URL across the relevant files).
