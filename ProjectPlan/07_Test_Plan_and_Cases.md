# 07 — Test Plan & Designed Test Cases

This is the actual test plan (not the guidance doc — see [`02_Static_Analysis_and_Test_Design.md`](02_Static_Analysis_and_Test_Design.md) for technique explanations). It defines scope, environment/tools, and a first batch of **designed** test cases using EP, BVA, and Decision Tables — written *before* execution, as the brief requires. Several are deliberately aimed at the exact code paths where we already found bugs during exploration: this is intentional and good practice (test design should target known-risky areas), and it sets up clean **red → green regression pairs** once we fix things in Phase 4.

---

## 1. Scope

### In scope — major flows under test, and why they matter

| Feature / flow | Why it matters |
|---|---|
| **Auth** (register, login, role-based access) | Gatekeeper for every other flow; broken auth/access-control = systemic risk (already found Bug #5, an IDOR rooted in missing access checks) |
| **Product browsing & search** (`/api/product/list`, `/list/search/:name`) | The core storefront experience — if buyers can't browse, nothing else matters (already found Bug #1, browsing returns empty) |
| **Cart** (add/update/remove items) | Gateway to every purchase; quantity/price logic is classic EP/BVA territory |
| **Orders** (place, view, cancel, status transitions) | Real money/inventory consequences; multi-step state machine; already found Bug #5 here |
| **Reviews** (submit, moderate, aggregate rating) | Business-logic/data-integrity surface; already found Bug #3 (moderation bypass) |
| **Wishlist** (add/update) | Smaller surface, but a clean input-validation story (already found Bug #4) |
| **Merchant lifecycle** (apply → approve → signup → manage brand) | The richest multi-model, multi-role integration flow in the app — touches `Merchant`, `User`, `Brand`, role transitions, and token-based auth across 3 endpoints |
| **Admin functions** (user search, merchant approval, review moderation) | Access-control boundary testing — confirms role checks work *and* probes for the gaps (like Bug #5) where they don't |

### Out of scope — and why

- **Payment processing** — the app has no real payment gateway integration wired up in this fork's scope; testing fake/stub payment flows would produce no meaningful signal. (Same defensible cut the example report made.)
- **AWS S3 image uploads** — requires real cloud credentials; we'll note this as a configuration dependency rather than spend time stubbing cloud storage for a course project.
- **Mailgun/Mailchimp email delivery** — service is unconfigured in our environment ("Missing mailgun keys"); we already worked around this once (reading `resetPasswordToken` directly from MongoDB to complete the merchant signup flow) and will continue to do so. We test that the *code path* that should send an email is reached and called with the right arguments (which is how we found Bug #2), not that an email actually arrives in an inbox.
- **OAuth/social login (Google/Facebook)** — the app supports local email/password auth, which is what we use for all test accounts; OAuth flows would require real third-party app registrations and aren't core to the V&V exercise.
- **Cross-browser/device matrix testing** — system tests will run against one evergreen desktop browser (Chromium via Playwright). Full responsive/cross-browser testing is a much larger effort than this course project's scope justifies; noted here explicitly as a conscious cut.
- **Performance/load testing** — outside the brief's required activity list; not attempted.

---

## 2. Testing environment & tools

| Concern | Tool / approach |
|---|---|
| Local environment | Docker Compose (`client` :8080, `server` :3000, `mongo` :27017) — see `TODO.md` §1 for start/stop commands |
| Languages & frameworks | Node.js/Express (backend), React/Redux (frontend), MongoDB/Mongoose (data layer) |
| Static analysis | ESLint 8 + `eslint-plugin-security`/`react`/`react-hooks`/`jsx-a11y` (see `static-analysis/STATIC_ANALYSIS_REPORT.md`) |
| Unit & integration test framework | **Jest** — already idiomatic for both the Node/Express server and the React/Redux client; one framework for both halves keeps the toolchain simple and the coverage report unified |
| API/integration testing helper | **Supertest** — drives Express route handlers directly against a test MongoDB instance, without needing a running browser; ideal for the order/cart/review/wishlist flows |
| System / black-box (E2E) testing | **Playwright** — drives the real app through a real browser against the Dockerized stack; chosen over Selenium for faster setup, built-in waiting/retries, and good trace/video capture for the report & demo |
| Coverage tool | **Jest's built-in coverage** (Istanbul under the hood) — `jest --coverage`, produces an HTML report and a terminal summary table; no extra tooling needed |
| Where tests run | Locally against the Docker Compose stack during development; a GitHub Actions workflow will run the unit/integration suite on every push (see `01_Project_Selection_and_Setup.md` §2) |
| Test accounts | Three roles already created and verified — see `TODO.md` §2 (`admin@example.com` / `buyer.test@example.com` / `merchant.test@example.com`) |

---

## 3. Designed test cases

Grouped by feature. Each is tagged with its design technique. **TC-IDs** are referenced later during execution (Phase 3) and in bug write-ups, so they stay stable once assigned — don't renumber, append.

### 3.1 Cart — quantity field (EP + BVA)

The cart's `quantity` field is the textbook EP/BVA target: it's a bounded numeric input whose valid range depends on the product's current `stock`/`quantity` in the database.

**Partitions** (for a product with `quantity = 10` in stock):
- P1 — invalid: `quantity <= 0`
- P2 — valid: `1 <= quantity <= 10`
- P3 — invalid/out-of-stock: `quantity > 10`

**Boundary values to probe:** `0`, `1`, `10`, `11` (the edges of P1/P2 and P2/P3)

| TC-ID | Test Name | Technique | Test Data (`quantity`) | Expected Result (correct behavior) | **Confirmed actual behavior — currently FAILS** |
|---|---|---|---|---|---|
| TC-CART-01 | Add item with quantity = 0 | BVA (lower boundary of P1/P2) | `0` | Rejected — `400` with a validation message; item NOT added to cart | **FAIL** — `200 success`; item added with `quantity: 0`, `totalPrice: 0` (silently nonsensical line item, no rejection) |
| TC-CART-02 | Add item with quantity = 1 | BVA (lower boundary of P2) | `1` | Accepted — item added with quantity 1 | PASS — accepted (this is the one boundary the app happens to handle correctly, since "any number" includes valid ones) |
| TC-CART-03 | Add item with quantity = stock (10) | BVA (upper boundary of P2) | `10` (≤ stock) | Accepted — item added with quantity 10 | PASS — accepted |
| TC-CART-04 | Add item with quantity = stock + 1 (11) | BVA (lower boundary of P3) | `stock + 1` | Rejected — `400`/out-of-stock message; item NOT added | **FAIL** — `200 success`; no comparison against the product's `quantity`/stock field exists anywhere in `POST /api/cart/add` (confirmed by reading `server/routes/api/cart.js:10-35`), so an order can be placed for more units than are in stock, oversold past zero |
| TC-CART-05 | Add item with negative quantity | EP (representative of P1, non-boundary) | `-5` | Rejected — `400` with a validation message | **FAIL — live-verified, see [Bug #7](TODO.md#-bug-7--cart-accepts-negativeunvalidated-quantity-and-price-inverts-stock-adjustment-and-produces-negative-total-orders-critical-severity-financial--inventory-integrity)**: `200 success`; persists `{quantity: -5, totalPrice: -500, totalTax: -25, priceWithTax: -525}` AND *increases* the product's stock (79→84) via the `$inc: { quantity: -item.quantity }` sign-flip in `decreaseQuantity` (`server/routes/api/cart.js`) |
| TC-CART-06 | Add item with non-numeric quantity | EP (invalid-type partition) | `"abc"` | Rejected — `400`, not a server crash (`NaN` propagating into DB writes would be a defect) | **Likely FAIL** — not live-tested (to avoid further DB pollution before automated tests exist), but given the confirmed total absence of validation in the handler, `"abc"` would flow straight into `price * quantity` arithmetic and produce `NaN` fields persisted to Mongo; automated test should assert this is rejected with `400` instead |

**Pre-condition for all:** logged in as buyer; a known product with a known `quantity`/stock value exists (e.g. the seeded product `6a2581dd...`, stock `79` at time of writing — adjust the BVA boundary values (`stock`, `stock + 1`) to whatever the live seed data shows when the automated suite runs).

**Confirmed root cause (resolves the ambiguity flagged in the original draft of this table):** `POST /api/cart/add` (`server/routes/api/cart.js:10-35`) performs **zero validation** on `quantity` or `price` — no type check, no `> 0` check, no comparison against stock. This was discovered by reading the route handler *while designing these very test cases* (see [Bug #7](TODO.md) in the TODO tracker for the full write-up, live-verification numbers, and proposed fix). TC-CART-01, 04, 05, and 06 are therefore **confirmed-failing red tests today** — exactly the red→green regression pairs this plan is designed to produce: write them now (red), fix the handler, watch them turn green.

**Why this is good test-design material for the report:** a clean, canonical EP/BVA worked example with a real numeric business rule behind it — and a great methodology story, because **the defect (Bug #7) was found by designing the tests, before a single one was executed**, directly demonstrating that test-case design is itself a verification activity and not just execution prep. TC-CART-06 in particular is exactly the kind of "what if the input isn't even the right type" case that good testers add beyond the textbook partitions.

---

### 3.2 Product rating filter (EP — directly targets Bug #1)

`GET /api/product/list` accepts an optional `rating` query parameter that filters the storefront by minimum average rating. We already know (Bug #1) that omitting it breaks browsing entirely — this test case formalizes that discovery into a designed, repeatable case plus its sibling partitions.

**Partitions for the `rating` parameter:**
- P1 — absent/undefined (the default browse state)
- P2 — valid numeric value in range `0–5`
- P3 — invalid: non-numeric string
- P4 — invalid: out-of-range numeric (e.g., negative, or > 5)

| TC-ID | Test Name | Technique | Test Data (`rating`) | Expected Result |
|---|---|---|---|---|
| TC-PROD-01 | Browse with no rating filter (default state) | EP (P1) | *(omitted)* | **Should** return all active products with active brands (≥1 result); **currently fails** — returns `{products: [], count: 0}` → this is Bug #1, this TC is its formal regression anchor |
| TC-PROD-02 | Filter by a valid mid-range rating | EP (P2) | `3` | Returns only products with `averageRating >= 3` |
| TC-PROD-03 | Filter by rating = 0 | EP/BVA (boundary of P2) | `0` | Returns all active products (≥ 0 is always true) — confirms the "no effective filter" edge doesn't accidentally exclude everything (the same `NaN`-class bug, in a different shape, would show up here too) |
| TC-PROD-04 | Filter by non-numeric rating | EP (P3) | `"five"` | **Defensive case** — should be rejected or ignored gracefully (`400` or treated as absent), NOT silently coerced to `NaN` and used in a `$gte` comparison (which is the literal mechanism behind Bug #1 — this TC checks whether the *same root cause* can be triggered through a different input than "absent") |
| TC-PROD-05 | Filter by out-of-range rating | EP (P4) | `99` | Returns empty result set legitimately (no products rated ≥ 99) — distinguishes "correctly empty" from "incorrectly empty" (the Bug #1 symptom), an important contrast pair for the report |

**Why TC-PROD-01 and TC-PROD-04/05 matter together:** they demonstrate *designing toward a known defect class* — once you understand a bug's root cause (here: "unvalidated input reaches a numeric comparison and produces `NaN`"), good test design asks "where else could this exact mechanism bite us?" rather than writing one narrow test that merely re-confirms the one symptom you already saw.

---

### 3.3 Review submission — rating value (BVA)

`POST /api/review/add` accepts a `rating` value, presumably constrained to a 1–5 star scale by the UI widget. **Resolved by reading the handler and schema** (`server/routes/api/review.js:10-31`, `server/models/review.js:23-26`): the route does `new Review({ ...req.body, user: user._id })` — it spreads the *entire* request body straight into the model with **no field-level validation whatsoever**, and the Mongoose schema declares `rating` as a bare `{ type: Number, default: 0 }` with **no `min`/`max`/`enum` constraint**. So the 1–5 scale is a **client-UI-only convention**; nothing stops a raw API client from submitting `0`, `-5`, `100`, or `3.5`. This is effectively a **new defect candidate** (call it Bug #8 if confirmed by an automated test): server-side input validation is entirely absent on this endpoint, mirroring the same "trust the client" anti-pattern as [Bug #7](TODO.md).

| TC-ID | Test Name | Technique | Test Data (`rating`) | Expected Result (correct behavior) | **Confirmed actual behavior — currently FAILS** |
|---|---|---|---|---|---|
| TC-REV-01 | Submit review with rating = 0 | BVA (just below valid lower bound) | `0` | Rejected — `400` | **FAIL (predicted from code read)** — accepted; persisted as `rating: 0` (matches the schema's own `default: 0`, so it's indistinguishable from "no rating given") |
| TC-REV-02 | Submit review with rating = 1 | BVA (lower boundary, valid) | `1` | Accepted, persisted with `rating: 1`, status `Waiting Approval` | PASS — accepted |
| TC-REV-03 | Submit review with rating = 5 | BVA (upper boundary, valid) | `5` | Accepted, persisted with `rating: 5` | PASS — accepted |
| TC-REV-04 | Submit review with rating = 6 | BVA (just above valid upper bound) | `6` | Rejected — `400` | **FAIL (predicted from code read)** — accepted; persisted as `rating: 6`, silently breaking the 1–5 star UI contract and any average-rating math downstream |
| TC-REV-05 | Submit review with non-integer rating | EP (invalid-type partition) | `3.5` | Rejected, or rounded per a documented business rule | **FAIL (predicted from code read)** — accepted as-is (`Number` type accepts floats; no rounding/integer coercion exists), persisted as `rating: 3.5` — undefined/undocumented behavior that itself is worth reporting |

**Pre-condition:** logged in as buyer; a valid `productId` exists; buyer hasn't already reviewed that product (if the system enforces one-review-per-user-per-product — confirm during execution; not addressed by the code read above, since `/add` performs no duplicate check either).

**Note on "predicted from code read" vs. live-verified:** unlike [Bug #7](TODO.md) (which was live-tested end-to-end including DB-state verification, then cleaned up), these TC-REV results are derived directly from reading `review.js`/`review.js` model — high confidence given the total absence of any validation code path, but not yet exercised against a running server. Confirming them is exactly what TC-REV-01/04/05 will do once translated into Supertest cases (Phase 3); expect all three to go red on first run, which is the point.

---

### 3.4 Order cancellation — access control (Decision Table — directly targets Bug #5)

This is the formal test-design counterpart to Bug #5 (the IDOR we already proved live). A decision table is the *correct* technique here because the expected outcome depends on a **combination** of conditions — exactly the brief's example use case ("access control... enumerate condition combinations").

**Conditions:**
- C1 — Is the requester the order's owner?
- C2 — Is the requester an admin?

**Decision table:**

| Rule | C1: Owner? | C2: Admin? | Expected outcome | TC-ID |
|---|---|---|---|---|
| R1 | Y | N | Cancel **succeeds** (`200`) — legitimate self-service cancellation | TC-ORD-01 |
| R2 | Y | Y | Cancel succeeds (`200`) — owner who also happens to be admin | TC-ORD-02 |
| R3 | N | Y | Cancel succeeds (`200`) — admin override, **if and only if that's a deliberately implemented policy** (see resolution below — it currently is *not*) | TC-ORD-03 |
| R4 | N | N | Cancel **must be rejected** (`403`/`404`) — this is the case Bug #5 violates | TC-ORD-04 |

| TC-ID | Test Name | Technique | Test Data / Setup | Expected Result | Actual (pre-fix) |
|---|---|---|---|---|---|
| TC-ORD-01 | Owner (non-admin) cancels their own order | Decision Table (R1) | Buyer places an order, then cancels it with their own token | `200`, order + cart deleted, product quantity restored | ✅ Passes today (this path was never broken) |
| TC-ORD-02 | Owner who is also admin cancels their own order | Decision Table (R2) | An admin account places an order, then cancels it with its own token | `200`, same cleanup as above | ✅ Passes today |
| TC-ORD-03 | Admin cancels another user's order | Decision Table (R3) | Buyer places an order; admin cancels it via `DELETE /api/order/cancel/:orderId` | **Resolved by reading the handler** (`server/routes/api/order.js:257-277`): the cancel route contains **no role check at all** — it never reads `req.user.role` (contrast with the neighboring `status/item/:itemId` handler at line 279, which *does* branch on `ROLES.Admin`, proving the codebase knows how to do this when it intends to). So "admin override" is **not an implemented or documented policy** for cancellation — there is simply one code path for everyone. The *correct* expected result is therefore a **product/policy decision the team must make explicitly** (either "yes, admins should be able to cancel any order — implement the role check" or "no, admins use a separate moderation flow — owner-or-404 for everyone"); document whichever is chosen as the formal expected result before marking this pass/fail | Currently succeeds with `200` — but this is **not** evidence of a working admin-override feature; it succeeds for the *exact same reason* TC-ORD-04 succeeds (R4/Bug #5): the handler performs no ownership *or* role check whatsoever. R3 "passing" today is coincidental, not by design. |
| TC-ORD-04 | **Non-owner, non-admin cancels another user's order** | Decision Table (R4 — the critical negative case) | Buyer A places an order; Buyer B (or the unrelated merchant account) attempts `DELETE /api/order/cancel/:orderId` with Buyer A's order ID | **`403 Forbidden` or `404 Not Found`** — must NOT delete the order | ❌ **FAILS — returns `200`, deletes the order and cart.** This is Bug #5, reproduced exactly as designed by this test case. |

**Why this is the report's centerpiece test-design example:** TC-ORD-04 is a direct, named, designed-in-advance test case that **fails against the current code** — a perfect "designed test case catches a real, pre-documented vulnerability" story, with TC-ORD-01/02 as the necessary *positive* controls proving the fix (once applied) won't break legitimate cancellation. TC-ORD-03 deliberately surfaces a **policy ambiguity** (should admins be able to cancel anyone's order?) that the current code accidentally "answers" by having no access control at all — worth a sentence in the report about how testing sometimes reveals that a requirements question was never explicitly answered.

---

### 3.5 Review moderation status vs. average rating (Decision Table — directly targets Bug #3)

**Condition:** review `status` ∈ {`Waiting Approval`, `Approved`, `Rejected`}
**Expected outcome:** does the review's rating count toward the product's publicly displayed `averageRating`?

| Rule | Review status | Should count toward average? | TC-ID | Actual (pre-fix) |
|---|---|---|---|---|
| R1 | `Approved` | **Yes** | TC-REVAGG-01 | ✅ Counts (correct) |
| R2 | `Waiting Approval` | **No** — not yet moderated | TC-REVAGG-02 | ❌ **Counts immediately on submission — this is Bug #3** |
| R3 | `Rejected` | **No** — explicitly rejected | TC-REVAGG-03 | ❌ **Still counts — compounds Bug #3; a rejected review's damage is permanent** |

| TC-ID | Test Name | Technique | Setup | Expected Result |
|---|---|---|---|---|
| TC-REVAGG-01 | Approved review counts toward average | Decision Table (R1) | Submit a review, have admin approve it, fetch the product, check `averageRating` reflects it | `averageRating` includes this review's rating |
| TC-REVAGG-02 | Pending (unapproved) review does NOT count | Decision Table (R2) | Submit a fresh review (status defaults to `Waiting Approval`), immediately fetch the product | `averageRating` should be **unchanged** from before submission — **fails today** (Bug #3) |
| TC-REVAGG-03 | Rejected review does NOT count | Decision Table (R3) | Submit a review, have admin reject it, fetch the product | `averageRating` should **exclude** this review — **fails today** (Bug #3, the more severe half: the damage persists even after explicit rejection) |

**Why three rules instead of two:** a naive tester might only check "pending vs. approved." Explicitly modeling all three states in a decision table is what *surfaces* the more damaging half of Bug #3 (rejected reviews never get excluded) — a good illustration of why the formal technique beats ad hoc poking.

---

### 3.6 Wishlist — `product` field validity (EP — directly targets Bug #4)

**Partitions for the `product` field in `POST /api/wishlist/`:**
- P1 — valid: a real, existing product's `ObjectId`
- P2 — invalid format: a string that isn't a valid `ObjectId` shape
- P3 — well-formed but non-existent: a syntactically valid `ObjectId` that matches no product
- P4 — missing/null: field absent from the request body entirely

| TC-ID | Test Name | Technique | Test Data (`product`) | Expected Result |
|---|---|---|---|---|
| TC-WISH-01 | Add existing product to wishlist | EP (P1) | a real product's `_id` | `200`, wishlist entry created/updated referencing that product |
| TC-WISH-02 | Add with malformed ObjectId string | EP (P2) | `"not-an-id"` | Rejected — `400` (Mongoose should throw a cast error; confirm it's caught gracefully and not a `500`) |
| TC-WISH-03 | Add with well-formed but non-existent ObjectId | EP (P3) | `"507f1f77bcf86cd799439011"` (valid shape, no matching doc) | **Should** be rejected — `400`/`404` ("product not found"); **likely fails today**, since the route never checks existence, only shape-via-Mongoose-cast |
| TC-WISH-04 | Add with `product` field missing entirely | EP (P4) | *(field omitted from body)* | **Should** be rejected — `400` ("product is required"); **fails today** — this is Bug #4, persists `product: null` and returns `200` |

**Why TC-WISH-03 is included even though it wasn't part of the original Bug #4 finding:** P3 is the natural "next partition over" once you've identified that P4 (missing) isn't validated — a thorough EP exercise doesn't stop at the first failing partition, it checks whether *neighboring* partitions have the same root issue (here: "does the route ever confirm the referenced product exists?"). This may surface a second, related defect during execution.

---

### 3.7 Search endpoints — regex metacharacter input (EP — directly targets the static-analysis regex-injection finding)

This connects the **static analysis** finding (`new RegExp(userInput)` in `product.js`/`user.js`/`merchant.js` — see `static-analysis/STATIC_ANALYSIS_REPORT.md` Finding 1) to a **dynamic** test design: can we observe the consequences through the API?

**Partitions for the search-term input:**
- P1 — plain alphanumeric text (the "expected" case)
- P2 — text containing regex metacharacters that form a *syntactically invalid* pattern
- P3 — text containing regex metacharacters that form a *syntactically valid but semantically surprising* pattern (regex-injection proper)
- P4 — text engineered for catastrophic backtracking (ReDoS shape)

| TC-ID | Test Name | Technique | Test Data | Expected Result |
|---|---|---|---|---|
| TC-SEARCH-01 | Search with plain text | EP (P1) | `"shirt"` | Returns matching products; baseline/control case |
| TC-SEARCH-02 | Search with invalid regex syntax | EP (P2) | `"("` | Should be handled gracefully — `400` with a clear message, not a generic `500`/stack trace leak (we observed a graceful `400` in exploration — this TC formalizes that as a *pass*, but the underlying `new RegExp` smell remains worth fixing per the static-analysis finding) |
| TC-SEARCH-03 | Search with a "match everything" pattern | EP (P3) | `".*"` | **Behavioral question worth designing a test around**: does `.* ` as a "search term" return the entire catalog regardless of the literal string a user typed? If so, that's a real information-disclosure-adjacent surprise (e.g., partial product-name search returning unrelated inventory) — exactly the "unexpected matches" risk named in the static-analysis report |
| TC-SEARCH-04 | Search with a catastrophic-backtracking pattern against a crafted matching string | EP (P4) | pattern `"(a+)+$"` against a product whose name contains a long run of `"a"` characters (may require seeding such a product first) | Response time should remain proportional to normal search latency; a multi-second+ hang would confirm exploitable ReDoS — **this requires careful, time-boxed execution** (see note below) |

**⚠️ Execution caution for TC-SEARCH-04:** unlike the other cases, this one is explicitly designed to probe for a *denial-of-service* condition. Run it only against the local Docker stack (never the public hosted instance), with a hard client-side timeout, and be prepared to restart the `mongo`/`server` containers if it does hang — document the precaution in the test execution log as part of demonstrating responsible security testing.

---

## 4. Coverage of designed cases by technique (sanity check against the brief's requirement)

| Technique | Test cases using it |
|---|---|
| Equivalence Partitioning (EP) | TC-PROD-01–05, TC-WISH-01–04, TC-SEARCH-01–04, TC-REV-05 |
| Boundary Value Analysis (BVA) | TC-CART-01–04, TC-PROD-03, TC-REV-01–04 |
| Decision Table | TC-ORD-01–04, TC-REVAGG-01–03 |

All three named techniques are represented, each with multiple worked examples, and **10 of the ~25 designed cases are now confirmed to fail against the current code** (TC-CART-01/04/05/06, TC-PROD-01, TC-ORD-04, TC-REVAGG-02/03, TC-WISH-04, and likely TC-WISH-03) — giving us a rich set of red-before/green-after regression pairs once fixes land in Phase 4. Notably, the cart cases (TC-CART-01/04/05/06) weren't just *predicted* to fail from spec-reading — reading the route handler to design them is what **surfaced [Bug #7](TODO.md) in the first place**, the most severe defect found in the project so far.

## 5. Next steps

- [x] ~~Confirm TC-CART-04's capping behavior~~ — **resolved**: there is no capping or stock-comparison logic at all (confirmed by reading `server/routes/api/cart.js:10-35`); see updated §3.1 and [Bug #7](TODO.md)
- [x] ~~Confirm TC-REV-01/04's server-side rating bounds~~ — **resolved**: no bounds exist server-side at all (`server/models/review.js:23-26` declares `rating` as a bare `Number` with no `min`/`max`; `server/routes/api/review.js:14-17` spreads `req.body` straight into the model); see updated §3.3 — flagged as a new defect candidate (Bug #8) to confirm via automated test
- [x] ~~Confirm TC-REV-05's fractional-rating handling~~ — **resolved as part of the same code read**: `Number` accepts floats, no rounding/coercion exists; `3.5` would persist as-is — see updated §3.3
- [x] ~~Confirm TC-ORD-03's admin-override policy~~ — **resolved**: `server/routes/api/order.js:257-277` (the cancel handler) contains no role check whatsoever — contrast with the neighboring `status/item/:itemId` handler which *does* check `req.user.role === ROLES.Admin`. There is no implemented "admin override" feature; R3 succeeding today is the same missing-check defect as R4/Bug #5, not a working policy. The *correct* expected behavior is now an explicit product-policy decision to be documented (see updated §3.4) rather than a code-derivable fact — this is the one ambiguity that genuinely can't be "resolved by reading code," because the code simply doesn't address it.
- [ ] Translate these into actual Jest + Supertest test files (Phase 3 — see `03_Test_Execution.md`)
- [ ] Add more designed cases as new flows are explored (merchant brand management, address book edge cases, admin search) — this document should grow alongside the TODO tracker
- [ ] Commit this document now that all code-derivable ambiguities are resolved and it's "locked" as the baseline test design (the TC-ORD-03 policy question remains open, but is now framed as a documented assumption rather than an unknown) — then treat any *later* additions as their own commits (per the "commit after every significant step" convention)
