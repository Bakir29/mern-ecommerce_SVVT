# Test Execution Log

Living record of every testing activity performed on the subject application (`mern-ecommerce`). Updated after each phase. Links to the artefacts that back up each claim — this document is the skeleton of the report's **Results** section.

---

## Summary table

| Phase | Status | Tests | Pass | Fail (intentional red) | Key artefact |
|---|---|---|---|---|---|
| Static Analysis | ✅ Complete | — | — | — | [`static-analysis/STATIC_ANALYSIS_REPORT.md`](../static-analysis/STATIC_ANALYSIS_REPORT.md) |
| Test Case Design | ✅ Complete | ~25 designed cases | — | — | [`07_Test_Plan_and_Cases.md`](07_Test_Plan_and_Cases.md) |
| Unit Testing | ✅ Complete | 19 | 19 | 0 | See §2 below |
| Integration Testing | ✅ Complete | 9 | 9 | 0 (all RED → GREEN after fixes) | See §3 below |
| Bug Fixes | ✅ Complete (4 of 7) | — | — | — | See §5.3; commits b495702, 46b115e, 0be310c, e453c15 |
| System / E2E Testing | ✅ Complete | 13 | 13 | 0 | See §4 below |
| Coverage Report | ✅ Complete | — | — | — | See §6 below |

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

## 4. System / E2E Tests

**Framework:** Playwright Test (Chromium, headless)

**Target:** Running Docker deployment at `http://localhost:8080`

**Configuration:** `workers: 1` (sequential, prevents server overload), `retries: 1`

**Run command:**
```bash
cd e2e && npx playwright test --reporter=list
```

**Date completed:** 2026-06-09

### 4.1 `e2e/tests/auth.spec.js` — Authentication flows

| TC-ID | Test | Expected | Actual | Result |
|---|---|---|---|---|
| ST-AUTH-01 | Valid admin credentials → redirected away from /login | URL ≠ /login | ✓ redirected to dashboard | ✅ PASS |
| ST-AUTH-02 | Wrong password → stays on login page | URL = /login or error shown | ✓ stays on login | ✅ PASS |
| ST-AUTH-03 | Empty form submission → stays on login | URL = /login | ✓ stays on login | ✅ PASS |
| ST-AUTH-04 | Authenticated user can log out | page not at /dashboard after logout | ✓ logged out successfully | ✅ PASS |

**Result: 4 / 4 passed**

### 4.2 `e2e/tests/homepage.spec.js` — Homepage and navigation

| TC-ID | Test | Expected | Actual | Result |
|---|---|---|---|---|
| ST-HOME-01 | Homepage loads and shows site navbar | Navbar visible | ✓ | ✅ PASS |
| ST-HOME-02 | Shop link navigates to /shop | URL = /shop | ✓ | ✅ PASS |
| ST-HOME-03 | Unauthenticated /dashboard shows no private content | No "my orders / account details" in body | ✓ blank page, no private data | ✅ PASS |
| ST-HOME-04 | Login page renders email and password fields | Inputs + Login button visible | ✓ | ✅ PASS |

**Result: 4 / 4 passed**

**Note on ST-HOME-03:** The app renders a blank page (empty React component) for unauthenticated `/dashboard` rather than redirecting to `/login`. There is no URL redirect and no auth-gate message — the route is silently inaccessible. This is documented behaviour, not an assertion failure.

### 4.3 `e2e/tests/shop.spec.js` — Product catalog

| TC-ID | Test | Expected | Actual | Result |
|---|---|---|---|---|
| ST-SHOP-01 | /shop page loads without a crash | No error overlay | ✓ | ✅ PASS |
| ST-SHOP-02 | Product cards visible [RED — Bug #1] | count > 0 | ✓ count > 0 | ✅ PASS† |
| ST-SHOP-03 | Search bar present on home page | input visible | ✓ | ✅ PASS |
| ST-SHOP-04 | Searching "a" returns results | body.length > 100 | ✓ | ✅ PASS |
| ST-SHOP-05 | Non-existent route shows body | body visible | ✓ | ✅ PASS |

**Result: 5 / 5 passed**

† **ST-SHOP-02 note:** This was originally designated as a RED test for Bug #1 (empty catalog). The test passes because the default catalog view returns products when no filters are active. Bug #1 manifests specifically when a category filter or rating range filter is applied — the broken default values cause the filtered query to return zero results. The system test covers the happy-path load; the bug is reliably reproducible via the filter UI. The bug remains open.

**System test total: 13 / 13 passed, 0 failed (1 intentional RED test turned green — see ST-SHOP-02 note)**

---

## 5. Regression Testing

Regression testing verifies that a change to the codebase does not silently re-introduce a previously fixed defect, and that existing behaviour is preserved when new code is added. In this project regression coverage is built from two sources: the **intentional RED tests** written before any fix is applied, and a **post-fix re-run protocol** that confirms each previously-red test turns green without breaking any currently-green test.

### 5.1 Strategy

| Layer | Tool | Role in regression |
|---|---|---|
| Unit | Jest (`server/utils/__tests__/store.test.js`) | Pin the arithmetic of `caculateItemsSalesTax` — catches silent sign-flip regressions in tax/total logic |
| Unit | Jest (`client/app/containers/Category/__tests__/reducer.test.js`) | Pin all 12 reducer branches — catches any future handler added or removed without a corresponding test update |
| Integration | Jest + Supertest (`server/__tests__/integration/cart.test.js`) | 3 RED tests (TC-CART-01/04/05) are the regression harness for Bug #7; they will fail the moment unvalidated quantity re-enters the route |
| Integration | Jest + Supertest (`server/__tests__/integration/order.test.js`) | 1 RED test (TC-ORD-04) is the regression harness for Bug #5; any ownership-check regression causes immediate failure |
| System | Playwright (`e2e/tests/`) | 13 smoke tests guard the deployed app; a broken build, routing regression, or auth regression shows up here before a user finds it |

### 5.2 Current RED tests — pre-fix regression harness

The following tests are **intentionally failing** because the bugs they document have not yet been fixed. Their failure is the expected, correct outcome. Once a fix lands, each test is expected to flip from RED to GREEN — if it does not, the fix is incomplete.

| Test file | TC-ID | Bug | Red assertion |
|---|---|---|---|
| `server/__tests__/integration/cart.test.js` | TC-CART-01 | Bug #7 | `POST /api/cart/add` with `quantity: 0` → expects 400, gets **200** |
| `server/__tests__/integration/cart.test.js` | TC-CART-04 | Bug #7 | `quantity: 11` (> stock of 10) → expects 400, gets **200** |
| `server/__tests__/integration/cart.test.js` | TC-CART-05 | Bug #7 | `quantity: -5` → expects 400, gets **200** (stock inflated 10 → 15) |
| `server/__tests__/integration/order.test.js` | TC-ORD-04 | Bug #5 | User B cancels User A's order → expects ≥ 403, gets **200** (IDOR) |

**Current integration test output (pre-fix):**
```
FAIL  __tests__/integration/cart.test.js
  ✓ TC-CART-02: quantity = 1 (200ms)
  ✓ TC-CART-03: quantity = 10 (180ms)
  ✓ auth guard → 401 (90ms)
  ✗ TC-CART-01: quantity = 0 → expects 400   [Bug #7]
  ✗ TC-CART-04: quantity = 11 → expects 400  [Bug #7]
  ✗ TC-CART-05: quantity = -5 → expects 400  [Bug #7]

FAIL  __tests__/integration/order.test.js
  ✓ TC-ORD-01: owner cancels own order (210ms)
  ✓ auth guard → 401 (85ms)
  ✗ TC-ORD-04: non-owner cancels → expects ≥403  [Bug #5]

Tests: 4 failed (intentional RED), 5 passed
```

### 5.3 Post-fix regression protocol

For each bug fix that lands, the following steps are executed and their outcomes recorded here:

1. Apply the fix to the relevant file(s).
2. Run the **full** test suite (`server`, `client`, `e2e`) — not just the tests for the fixed bug.
3. Confirm: every previously-RED test for that bug is now **GREEN**.
4. Confirm: no previously-GREEN test has flipped to **RED** (no regression introduced by the fix).
5. Record results in the table below.

| Bug | Fix applied | RED → GREEN | Green tests still green | Regression introduced? | Status |
|---|---|---|---|---|---|
| Bug #7 | `server/routes/api/cart.js` — qty validation + server-side price lookup (commit b495702) | TC-CART-01, TC-CART-04, TC-CART-05 ✅ | 15 server + 13 client ✅ | None | ✅ Fixed |
| Bug #5 | `server/routes/api/order.js` — ownership check + 404 guard (commit 46b115e) | TC-ORD-04 ✅ | 15 server + 13 client ✅ | None | ✅ Fixed |
| Bug #6 | `client/app/containers/Category/actions.js` + `reducer.js` — import + handler (commit 0be310c) | Unit test updated: `selectedCategory` now set ✅ | 13 client ✅ | None | ✅ Fixed |
| Bug #3 | `server/routes/api/review.js` — rating bounds 1–5 (commit e453c15) | No pre-existing red test; manual verification | 15 server + 13 client ✅ | None | ✅ Fixed |
| Bug #1 | — | — | — | — | ⏳ Open |
| Bug #4 | — | — | — | — | ⏳ Open |
| Bug #2 | — | — | — | — | ⏳ Open |

### 5.4 Worked example — Bug #7 fix (planned)

**Before fix** — TC-CART-01/04/05 are RED; unit characterization test pins current buggy arithmetic:

```
server/utils/__tests__/store.test.js
  ✓ Bug #7 characterization: qty=-5 → totalPrice=-500 (documents bug)
```

**Proposed fix** — add validation at the top of `POST /api/cart/add` (`server/routes/api/cart.js:10`):

```js
// proposed addition
const qty = Number(req.body.quantity);
if (!Number.isInteger(qty) || qty < 1 || qty > product.quantity) {
  return res.status(400).json({ error: 'Invalid quantity' });
}
```

**After fix** — expected test output:

```
PASS  __tests__/integration/cart.test.js
  ✓ TC-CART-02: quantity = 1
  ✓ TC-CART-03: quantity = 10
  ✓ auth guard → 401
  ✓ TC-CART-01: quantity = 0 → 400   [was RED, now GREEN ✓]
  ✓ TC-CART-04: quantity = 11 → 400  [was RED, now GREEN ✓]
  ✓ TC-CART-05: quantity = -5 → 400  [was RED, now GREEN ✓]

Tests: 6 passed, 0 failed
```

The unit characterization test (`qty=-5 → totalPrice=-500`) will also need updating: once the fix is in, the route blocks the request before `caculateItemsSalesTax` is ever called with a negative quantity, so the characterization test becomes a historical record and can be replaced with a positive-path assertion.

---

## 6. Test Coverage Analysis

**Tool:** Jest built-in coverage (Istanbul / V8)

**Run commands:**
```bash
cd server && npx jest --coverage --testTimeout=60000 --forceExit
cd client && npx jest --coverage
```

**Date run:** 2026-06-09

### 6.1 Client coverage — `client/app/containers/Category/`

| File | Statements | Branches | Functions | Lines |
|---|---|---|---|---|
| `constants.js` | 100% | 100% | 100% | 100% |
| `reducer.js` | 100% | 100% | 100% | 100% |
| **Total** | **100%** | **100%** | **100%** | **100%** |

All 12 action-type branches in the reducer are exercised, including the Bug #6 characterization path. 100% coverage is achievable here because the reducer is a pure function with no I/O or async code.

### 6.2 Server coverage

Coverage is collected across all three test suites (unit + integration). The 4 intentional RED tests still run and contribute coverage even though they assert wrong behaviour.

#### Models (`server/models/`)

| File | Statements | Branches | Functions | Lines | Notes |
|---|---|---|---|---|---|
| `cart.js` | 100% | 100% | 100% | 100% | |
| `order.js` | 100% | 100% | 100% | 100% | |
| `product.js` | 100% | 100% | 100% | 100% | |
| `review.js` | 100% | 100% | 100% | 100% | |
| `wishlist.js` | 100% | 100% | 100% | 100% | |
| `user.js` | 100% | 50% | 100% | 100% | line 12 — branch on optional field |

Models score 100% statements/functions because integration tests hit the Mongoose schema definitions when creating documents. The 50% branch in `user.js` is a default-value ternary that is never exercised with both outcomes.

#### Routes (`server/routes/api/`)

| File | Statements | Branches | Functions | Lines | Uncovered (key lines) |
|---|---|---|---|---|---|
| `cart.js` | 57.5% | 100% | 50% | 57.5% | 31, 38–79 (decrease/clear handlers) |
| `order.js` | 26.5% | 0% | 20% | 27.5% | 15–51, 59–121, 129–251, 280–332 |
| `auth.js` | 18.0% | 0% | 0% | 18.0% | 20–344 (register, social OAuth, reset) |
| `product.js` | 18.7% | 0% | 0% | 18.7% | 25–421 (all product CRUD) |
| `category.js` | 23.9% | 0% | 0% | 23.9% | 13–175 |
| `brand.js` | 21.6% | 0% | 0% | 21.8% | 14–248 |
| `review.js` | 23.7% | 0% | 0% | 23.7% | 11–180 |
| `user.js` | 31.4% | 0% | 0% | 31.4% | 12–103 |
| `merchant.js` | 18.1% | 0% | 0% | 18.3% | 17–357 |
| `address.js` | 26.3% | 0% | 0% | 26.3% | 10–99 |
| `newsletter.js` | 42.9% | 0% | 0% | 42.9% | 8–22 |
| `contact.js` | 25.0% | 0% | 0% | 25.0% | 9–54 |
| `index.js` | 100% | 100% | 100% | 100% | |
| **Total routes/api** | **26.2%** | **0%** | **7.0%** | **26.4%** | |

`cart.js` is the best-covered route (57.5%) because 6 integration tests target `POST /api/cart/add` directly. All other endpoints (decrease quantity, clear cart, all of auth, product CRUD, etc.) have zero integration test coverage — their statement coverage comes only from the `require()` chain when the app is loaded.

#### Utils (`server/utils/`)

| File | Statements | Branches | Functions | Lines | Notes |
|---|---|---|---|---|---|
| `store.js` | 41.9% | 8.7% | 38.5% | 41.9% | Lines 5–71 and 113–123 uncovered (slug helpers, `reduceCartItems`) |
| `integrationSetup.js` | 86.7% | 100% | 66.7% | 86.7% | `clearCollections` disconnect paths |
| `auth.js` | 27.3% | 0% | 0% | 27.3% | Token-generation helpers not called by unit tests |
| `queries.js` | 23.1% | 0% | 0% | 23.1% | DB query helpers only called by uncovered routes |
| `storage.js` | 18.8% | 0% | 0% | 18.8% | File-upload helpers (S3) |

`store.js` is partially covered (41.9%): the 6 unit tests exercise `caculateItemsSalesTax` and `caculateOrderTotal`, but the slug-generation helpers (`slugify`, `getSlug`) and `reduceCartItems` remain untested.

#### Overall server summary

| Layer | Statements | Branches | Functions | Lines |
|---|---|---|---|---|
| Models | ~100% | ~95% | 100% | ~100% |
| Routes/api | 26.2% | 0% | 7.0% | 26.4% |
| Utils | 41.0% | 5.1% | 35.0% | 41.0% |
| Services | 36.7% | 0% | 40.0% | 36.7% |

### 6.3 Coverage interpretation

**Why route coverage is low:** Integration tests were intentionally scoped to the two highest-severity bugs (Bug #7 — `POST /api/cart/add`; Bug #5 — `DELETE /api/order/cancel/:orderId`). Every other API endpoint is untested at the integration level. This is a deliberate choice for a course project with limited time — the red tests needed to prove the bugs; broad route coverage was a secondary concern.

**What 0% branch on routes means:** No branch coverage is collected for untested routes because no request ever reaches those handlers. The `if/else` chains inside `auth.js`, `product.js`, etc. are entirely dark.

**Where coverage is strong:** Pure functions (reducer, tax calculations) and Mongoose schema definitions hit 100% because they are fully deterministic and easy to exercise in isolation. This is where unit testing pays off most clearly.

**Coverage gaps to address (post-fix):** After the Bug #7 and Bug #5 fixes are applied, additional integration tests should target at minimum: `DELETE /api/order/cancel` (already covered for IDOR), `POST /api/auth/register`, `POST /api/review/add` (Bug #3 — rating bounds), and `POST /api/wishlist/add` (Bug #4 — null product). Each new integration test will raise branch coverage on the corresponding route file from 0%.

---

## 7. Bugs found — summary

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

## 7. Pending phases

- [ ] **Bug fixes** — implement fixes for Bugs #5 and #7 first (highest severity; have complete red→green test harness ready), then #1, #3, #4, #6, #2. Each fix should reference the TC-ID it resolves.
- [ ] **Regression verification** — after each fix, execute the protocol in §5.3 and fill in the table in §5.3. Red → green for the fixed bug, no previously-green tests broken.
- [x] **Coverage report** — completed; see §6. Client reducer: 100% all metrics. Server routes/api: 26% stmt (low by design — only Bug #5 and #7 routes were targeted). Under-tested paths identified in §6.3.
- [ ] **Final report** — structured per the course template; this document's tables feed directly into the Results section.
- [ ] **Presentation / demo** — live demo of a red→green test cycle (recommended: Bug #7 fix, since the `quantity: -5` stock-inflation is visually striking and the test output tells the whole story).
