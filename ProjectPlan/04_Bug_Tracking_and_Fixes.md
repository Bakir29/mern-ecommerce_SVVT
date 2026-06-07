# 04 — Bug Reports and Fixes

This activity is the connective tissue between testing, GitHub usage, and regression testing — done well, it makes all three rubric lines stronger at once. Aim to find, document, and fix a **handful of real bugs** (quality over quantity — 3-6 well-documented, genuinely-fixed bugs beat 20 trivial typo fixes).

## Where bugs come from
You'll naturally surface candidates from every other phase:
- Static analysis findings (Part A of `02_...md`) that represent real defects, not just style nits
- Failing test cases from test execution (`03_...md`) — any red test is a bug-report candidate
- Exploratory poking around the app while designing test cases (often the richest source — the example report found its two real bugs this way: a broken "unsubscribe with non-subscribed email" flow, and rendering issues)

## The pipeline: Issue → Fix → Linked Commit

1. **File a GitHub Issue** for each bug, with:
   - A clear title (symptom, not diagnosis — e.g., "Unsubscribing with a non-subscribed email shows a false success message" not "fix unsubscribe bug")
   - Steps to reproduce
   - Expected vs. actual behavior
   - Screenshots/console output where relevant
   - Severity/priority label if you're using labels (optional but adds polish)

2. **Fix the bug** on a branch (or directly, if your workflow is simple) — keep the fix focused; don't bundle unrelated refactors into the same commit.

3. **Commit with a message that references the issue**, using GitHub's auto-linking keywords so the issue closes automatically and the link is visible in both places:
   ```
   Fix unsubscribe success message for non-subscribed emails

   Show an error alert instead of a success alert when the
   submitted email has no active subscription.

   Fixes #<issue-number>
   ```
   (`Fixes`, `Closes`, `Resolves` all trigger auto-close on merge to the default branch.)

4. **Re-run the relevant test(s)** to confirm the fix — this is your regression-testing evidence (see `03_...md` §4). Capture the before (red) → after (green) pair.

5. **Redeploy** so the hosted version reflects the fix (don't let your live demo show a bug you've "fixed" only in the report).

## What to document in the report for each bug
For each bug you fix, the report should show:
- What you found and how (which test/tool surfaced it)
- The issue link
- A short description of the root cause (as much as you could determine — you don't need a deep-dive if the fix is simple, but say *something* about why it was happening)
- The fix commit link
- The before/after test result (red → green)

This turns a simple bug fix into a complete verification-and-validation story — exactly what an SVVT report should demonstrate.

## A note on bugs you find but don't fix
Not every bug needs to be fixed (some may be out of scope, in third-party code, or too risky to touch near a deadline). It's completely fine — and honest — to document a bug you *chose not to fix* and explain why, the way the example report flagged the unrendered-images issue and the login-automation blocker as known limitations in its "Final Thoughts" section. Just make sure your *fixed* bug count is non-trivial; "we found bugs but fixed none" would look like you skipped half the activity.
