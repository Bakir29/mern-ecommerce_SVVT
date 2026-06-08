# Test Execution Log

Living record of every testing activity performed on the subject application (`mern-ecommerce`). Updated after each phase. Links to the artefacts that back up each claim — this document is the skeleton of the report's **Results** section.

---

## Summary table

| Phase | Status | Tests | Pass | Fail (intentional red) | Key artefact |
|---|---|---|---|---|---|
| Static Analysis | ✅ Complete | — | — | — | [`static-analysis/STATIC_ANALYSIS_REPORT.md`](../static-analysis/STATIC_ANALYSIS_REPORT.md) |
| Test Case Design | ✅ Complete | ~25 designed cases | — | — | [`07_Test_Plan_and_Cases.md`](07_Test_Plan_and_Cases.md) |
| Unit Testing | ✅ Complete | 19 | 19 | 0 | See §2 below |
| Integration Testing | ✅ Complete | 9 | 5 | 4 | See §3 below |
| Bug Fixes | ⏳ Pending | — | — | — | [`TODO.md`](TODO.md) |
| System / E2E Testing | ⏳ Pending | — | — | — | Playwright (planned) |
| Coverage Report | ⏳ Pending | — | — | — | Jest `--coverage` |

---

## 1. Static Analysis

**Tool:** ESLint 8 + `eslint-plugin-security@1.7.1` / `eslint-plugin-react` / `eslint-plugin-react-hooks` / `eslint-plugin-jsx-a11y` / `@babel/eslint-parser`

**Scope:** 266 files — `server/` (routes, models, utils, config) and `client/app/` (containers, components, reducers, actions)

**Date completed:** 2026-06-08

**Headline findings:**

| Severity | Finding | Rule | File |
|---|---|---|---|
| HIGH | Regex injection / ReDoS — `new RegExp(userInput)` | `detect-non-literal-regexp` | `server/routes/api/product.js` |
| MEDIUM | Latent ReferenceError — `CATEGORY_SELECT` imported in constants but never wired in actions/reducer | manual triage after `detect-object-injection` | `client/app/containers/Category/actions.js` (Bug #6) |
| LOW | 3 × `detect-object-injection` on safe computed-key patterns | false positives — triaged and dismissed | various |
| INFO | 12 × accessibility violations (`jsx-a11y`) | `jsx-a11y/*` | `client/app/` |
| INFO | Missing `key` props, unused state, hook dependency warnings | `react/*`, `react-hooks/*` | `client/app/` |

Full write-up, code snippets, root causes and proposed fixes: [`static-analysis/STATIC_ANALYSIS_REPORT.md`](../static-analysis/STATIC_ANALYSIS_REPORT.md)

---

## 2. Unit Tests

**Framework:** Jest 30 (server) + Jest 30 + babel-jest (client)

**Run commands:**
```bash
# server
cd server && npx jest utils/__tests__/store.test.js --verbose

# client
cd client && npx jest app/containers/Category/__tests__/reducer.test.js --verbose
```

### 2.1 Server — `server/utils/__tests__/store.test.js`

**Module under test:** `server/utils/store.js` — pure tax/total calculation utilities

| TC | Test name | Result | Notes |
|---|---|---|---|
| — | `caculateItemsSalesTax` — taxable item (price=100, qty=2) | ✅ PASS | totalPrice=200, totalTax=10, priceWithTax=210 |
| — | `caculateItemsSalesTax` — non-taxable item | ✅ PASS | totalTax=0, priceWithTax=0 |
| — | `caculateItemsSalesTax` — multiple line items | ✅ PASS | each item calculated independently |
| — | `caculateItemsSalesTax` — negative quantity (Bug #7 characterization) | ✅ PASS | asserts CURRENT buggy behaviour: totalPrice=-500, totalTax=-25, priceWithTax=-525 — pins the root-cause arithmetic so it's visible at the unit level |
| — | `caculateOrderTotal` — sums non-cancelled items only | ✅ PASS | cancelled items excluded from total |
| — | `caculateOrderTotal` — all-cancelled / empty order returns 0 | ✅ PASS | |

**Result: 6 / 6 passed**

### 2.2 Client — `client/app/containers/Category/__tests__/reducer.test.js`

**Module under test:** `client/app/containers/Category/reducer.js` — pure Redux reducer

| TC | Test name | Result | Notes |
|---|---|---|---|
| — | Unknown action returns initial state | ✅ PASS | |
| — | `FETCH_CATEGORIES` replaces list | ✅ PASS | |
| — | `FETCH_STORE_CATEGORIES` replaces store list | ✅ PASS | |
| — | `FETCH_CATEGORY` replaces single category | ✅ PASS | |
| — | `ADD_CATEGORY` appends without mutating previous state | ✅ PASS | immutability confirmed |
| — | `REMOVE_CATEGORY` removes by `_id`, preserves order | ✅ PASS | |
| — | `CATEGORY_CHANGE` merges into `categoryFormData` | ✅ PASS | |
| — | `CATEGORY_EDIT_CHANGE` merges into `category` | ✅ PASS | |
| — | `SET_CATEGORY_FORM_ERRORS` replaces formErrors | ✅ PASS | |
| — | `SET_CATEGORY_FORM_EDIT_ERRORS` replaces editFormErrors | ✅ PASS | |
| — | `SET_CATEGORIES_LOADING` sets/unsets isLoading | ✅ PASS | |
| — | `RESET_CATEGORY` clears form, identity and errors | ✅ PASS | |
| — | `CATEGORY_SELECT` falls through to default — Bug #6 documentation | ✅ PASS | confirms constant exists, no handler wired → dispatching it is a silent no-op |

**Result: 13 / 13 passed**

**Unit test total: 19 / 19 passed, 0 failed**

---

## 3. Integration Tests

**Framework:** Jest 30 + Supertest 7 + mongodb-memory-server 7 (in-memory MongoDB — real Mongoose, real route handlers, no mocks)

**Setup:** `server/utils/integrationSetup.js` starts a fresh MongoMemoryServer instance per test suite; `server/app.js` exports the Express app separately from `listen()` so Supertest can import it without starting a real server or connecting to the live database.

**Run command:**
```bash
cd server && npx jest __tests__/integration --verbose --testTimeout=60000 --forceExit
```

> Note: the first run downloads a MongoDB binary (~70 MB). Subsequent runs use the cached binary and take ~5-7 s.

### 3.1 `server/__tests__/integration/cart.test.js`

**Route under test:** `POST /api/cart/add` — authenticated buyer adds items to cart

| TC-ID | Test name | Expected | Actual | Result |
|---|---|---|---|---|
| TC-CART-02 | quantity = 1 (lower valid boundary) | 200 | 200 | ✅ PASS |
| TC-CART-03 | quantity = 10 (at stock level) | 200 | 200 | ✅ PASS |
| — | No token → auth guard | 401 | 401 | ✅ PASS |
| TC-CART-01 | quantity = 0 | 400 | **200** | ❌ FAIL — Bug #7 |
| TC-CART-04 | quantity = 11 > stock (10) | 400 | **200** | ❌ FAIL — Bug #7 |
| TC-CART-05 | quantity = -5 (negative) | 400 | **200** | ❌ FAIL — Bug #7 (live-verified: stock inflated 10→15, totalPrice=-500) |

**Result: 3 / 6 passed, 3 / 6 failed (all failures are intentional red tests confirming Bug #7)**

### 3.2 `server/__tests__/integration/order.test.js`

**Route under test:** `DELETE /api/order/cancel/:orderId` — authenticated user cancels an order

| TC-ID | Test name | Expected | Actual | Result |
|---|---|---|---|---|
| TC-ORD-01 | Owner (User A) cancels their own order | 200 + order deleted from DB | 200 ✓ | ✅ PASS |
| — | No token → auth guard | 401 | 401 | ✅ PASS |
| TC-ORD-04 | Non-owner (User B) cancels User A's order | ≥ 403 + order NOT deleted | **200**, order deleted | ❌ FAIL — Bug #5 IDOR |

**Result: 2 / 3 passed, 1 / 3 failed (intentional red test confirming Bug #5)**

**Integration test total: 5 / 9 passed, 4 / 9 failed (all 4 failures are intentional red tests)**

---

## 4. Bugs found — summary

Full write-ups (symptom, root cause, code snippet, live verification, proposed fix) in [`TODO.md`](TODO.md).

| # | Bug | Severity | Found by | Status |
|---|---|---|---|---|
| Bug #1 | Product catalog returns empty (rating filter default breaks query) | HIGH | Manual exploration | Open |
| Bug #2 | Order confirmation email always uses missing/null data | MEDIUM | Code reading | Open |
| Bug #3 | Unapproved/rejected reviews count toward public average rating | MEDIUM-HIGH | Code reading | Open |
| Bug #4 | Wishlist accepts null `product` field → orphaned records | LOW-MEDIUM | Code reading | Open |
| Bug #5 | IDOR: any authenticated user can cancel any other user's order | HIGH | Code reading + live verification + **integration test TC-ORD-04** | Open |
| Bug #6 | `CATEGORY_SELECT` constant never imported in actions → latent ReferenceError | LOW | Static analysis (ESLint) + **unit test** | Open |
| Bug #7 | Cart accepts unvalidated/negative `quantity` → stock sign-flip + negative order totals | CRITICAL | Test case design + live verification + **unit characterization test** + **integration tests TC-CART-01/04/05** | Open |

---

## 5. Pending phases

- [ ] **Bug fixes** — implement fixes for Bugs #5 and #7 first (highest severity; have complete red→green test harness ready), then #1, #3, #4, #6, #2. Each fix should reference the TC-ID it resolves.
- [ ] **Coverage report** — run `npm run test:coverage` in both `server/` and `client/`; record line/branch coverage % per module; identify any under-tested paths.
- [ ] **System / E2E testing** — Playwright tests for key user journeys through the browser (browse → add to cart → checkout flow; login/logout; admin moderation). Planned in [`07_Test_Plan_and_Cases.md`](07_Test_Plan_and_Cases.md).
- [ ] **Regression verification** — after each bug fix, re-run the full test suite and confirm the previously-failing red tests now pass (green), and no previously-passing tests broke (no regressions).
- [ ] **Final report** — structured per the course template; this document's tables feed directly into the Results section.
- [ ] **Presentation / demo** — live demo of a red→green test cycle (recommended: Bug #7 fix, since the `quantity: -5` stock-inflation is visually striking and the test output tells the whole story).
