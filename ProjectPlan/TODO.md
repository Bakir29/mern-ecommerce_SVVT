# TODO — SVVT Project Working Tracker

Living checklist + findings log for the **mohamedsamara/mern-ecommerce** SVVT project (forked to `Bakir29/mern-ecommerce_SVVT`, cloned to `Project/mern-ecommerce/`, running locally via Docker Compose). Update this as work progresses — check items off, add new findings as they surface.

---

## 1. Environment status

- [x] Forked repo to `https://github.com/Bakir29/mern-ecommerce_SVVT`
- [x] Cloned to `Project/mern-ecommerce/`, `upstream` remote added pointing to original
- [x] Stack running locally via `docker compose up -d --build` (client :8080, server :3000, mongo :27017)
- [x] Database seeded (`npm run seed:db` — runs automatically on container start)
- [x] **Static analysis COMPLETE** (both server + client) — full writeup with all findings, code snippets, triage, and proposed fixes: [`static-analysis/STATIC_ANALYSIS_REPORT.md`](../static-analysis/STATIC_ANALYSIS_REPORT.md). This satisfies VVT activity #1 ("identify potential code quality issues, bugs, or vulnerabilities without executing the program"). Headlines:
  - **Server** (45 files, ESLint + `eslint-plugin-security`): user input flows unescaped into `new RegExp()` in 3 search endpoints (incl. one public) — regex-injection/ReDoS; pairs with Bug #5 for a security thread. Plus 3 triaged-false-positive `detect-object-injection` warnings and 3 unused-import findings.
  - **Client** (221 files, ESLint + security/react/react-hooks/jsx-a11y, `@babel/eslint-parser` for class-property syntax): **found Bug #6 — `CATEGORY_SELECT` referenced in `Category/actions.js:52` but never imported → guaranteed `ReferenceError` the instant that (currently-unwired, dead-code) action creator is dispatched.** A textbook "static analysis catches what dynamic testing can't" story. Also: 31 more triaged-false-positive `detect-object-injection` warnings (same noisy-rule pattern — recommend disabling/tuning it, a nice SAST-maturity point), 36 accessibility findings (`jsx-a11y/*`), 9 batch-fixable `no-case-declarations` in reducers, 66 `no-unused-vars`, and 3 `react-hooks/exhaustive-deps` stale-closure candidates worth a closer look.
- [ ] **→ Ready to make the initial commit** now that static analysis is done (per your plan) — see §3 for the new Bug #6 writeup first
- [ ] Decide & document approach for Mailgun/Mailchimp/AWS S3 (currently unconfigured — "Missing mailgun keys" warning on startup; emails silently fail). See `01_Project_Selection_and_Setup.md` §1b step 5.
- [ ] Set up GitHub Issues / labels convention on the fork
- [ ] Set up CI (GitHub Actions) to run the test suite on push (recommended in `01_...md` §2)
- [ ] Deploy to a public host (Vercel for client, Render/Railway for server, MongoDB Atlas for DB) — see `01_...md` §3

To start/stop the stack:
```
cd Project/mern-ecommerce
docker compose up -d        # start
docker compose down         # stop
docker compose ps           # status
docker logs server --tail 50   # check server logs
```

## 2. Test accounts (created & verified working)

| Role | Email | Password | Notes |
|---|---|---|---|
| Admin | `admin@example.com` | `admin123` | Auto-seeded by docker-compose; role `ROLE ADMIN` |
| Buyer/Member | `buyer.test@example.com` | `BuyerTest123` | Registered via `/api/auth/register`; role `ROLE MEMBER` |
| Merchant | `merchant.test@example.com` | `MerchantTest123` | Full apply → admin-approve → token signup flow completed manually (see §4 below — email step bypassed by reading `resetPasswordToken` directly from MongoDB since Mailgun isn't configured) |

**The merchant creation flow itself is a great integration-test candidate**: it touches `Merchant`, `User`, and `Brand` models, role transitions, and token-based auth across three endpoints (`POST /api/merchant/add` → `PUT /api/merchant/approve/:id` → `POST /api/merchant/signup/:token`).

## 3. Confirmed bugs found (ready to file as GitHub issues)

These were found through actual exploration/testing — exactly the V&V process the report needs to document. Each has a clear root cause and a proposed fix, ready to become an Issue → Fix → linked-commit → before/after regression-test story (see `04_Bug_Tracking_and_Fixes.md`).

### 🐛 Bug #1 — Product catalog browsing returns empty (HIGH severity)
- **Symptom:** `GET /api/product/list` returns `{"products": [], "count": 0}` even though the DB has 100 active products with active brands. The storefront would appear completely empty to every visitor on a default page load.
- **Root cause:** `server/utils/queries.js`, function `getStoreProductsQuery`, lines 9–11:
  ```js
  const ratingFilter = rating
      ? { rating: { $gte: rating } }
      : { rating: { $gte: rating } };   // identical to the truthy branch — copy/paste bug
  ```
  When the client doesn't pass a `rating` query param (the default browse state), `rating` is `undefined` → `Number(undefined)` → `NaN` → the aggregation's final `$match` becomes `averageRating: { $gte: NaN }`. MongoDB's `$gte` against `NaN` is false for every document, so **all products get filtered out**.
- **Verified independently:** replayed the full aggregation pipeline directly in `mongosh` — `{ $gte: NaN }` → 0 results, `{ $gte: 0 }` → 100 results.
- **Proposed fix:** `const ratingFilter = rating ? { rating: { $gte: rating } } : {};` and only merge `averageRating` into `matchQuery` when a rating filter was actually provided (or default to `{ $gte: 0 }`).
- **Why it's great for the report:** highest-impact bug found (breaks the core browsing feature), cleanly root-caused to one line, trivially fixable, and perfect for a red→green regression-test pair (`GET /api/product/list` with no rating param: fails before fix, passes after).

### 🐛 Bug #2 — Order confirmation email always built with missing data (MEDIUM severity)
- **Symptom:** Not visible at runtime (errors are swallowed — see below), but confirmed by code inspection + signature comparison.
- **Root cause:** `server/routes/api/order.js` line 43:
  ```js
  await mailgun.sendEmail(order.user.email, 'order-confirmation', newOrder);
  ```
  `sendEmail`'s actual signature is `(email, type, host, data)` (`server/services/mailgun.js` line 23), and the `order-confirmation` template reads from `data` (the **4th** argument): `template.orderConfirmationEmail(data)`. The order route passes `newOrder` as the 3rd argument (`host`), leaving `data` as `undefined`. Compare with the *correct* call pattern in `server/routes/api/merchant.js` line 352: `mailgun.sendEmail(email, 'merchant-signup', host, {...})`.
- **Secondary issue masking it:** `sendEmail` wraps its body in try/catch and silently returns the error instead of logging/throwing — exactly the kind of swallowed-error code smell a static analysis tool flags, and exactly why this bug is invisible in normal operation.
- **Proposed fix:** `await mailgun.sendEmail(order.user.email, 'order-confirmation', req.headers.host, newOrder);`
- **Why it's great for the report:** demonstrates a *code-review-driven* (white-box) finding that complements the black-box bug above — shows you can pair static reading with dynamic testing, and ties directly into your static-analysis section (inconsistent function call signatures, swallowed errors).

### 🐛 Bug #3 — Unapproved/rejected reviews affect the public average product rating (MEDIUM-HIGH severity, data-integrity/business-logic)
- **Symptom:** Submitting a review immediately changes the product's computed `averageRating` shown to all buyers — *before* any moderator approves it. A rejected review's rating is never excluded either.
- **Root cause:** `server/utils/queries.js`, the aggregation pipeline inside `getStoreProductsQuery` (~lines 53–65) does:
  ```js
  { $lookup: { from: 'reviews', localField: '_id', foreignField: 'product', as: 'reviews' } },
  { $addFields: { totalRatings: { $sum: '$reviews.rating' }, totalReviews: { $size: '$reviews' } } },
  ```
  with **no filter on `status`**, even though `Review` has a moderation workflow (`Waiting Approval` / `Approved` / `Rejected` — see `server/models/review.js` and the `/api/review/approve/:reviewId` & `/reject/:reviewId` endpoints). All reviews — regardless of moderation state — count toward the displayed rating.
- **Verified:** submitted a review as the buyer test account; API confirmed `"status":"Waiting Approval"` with the message "will appear when approved" — implying the *intended* behavior is that it shouldn't count yet.
- **Impact:** undermines the entire point of review moderation; opens the door to rating manipulation (post many low-star "reviews" — even if later rejected, the damage to the average persists forever since rejected reviews are never excluded from the aggregation).
- **Proposed fix:** add a `$match: { 'reviews.status': REVIEW_STATUS.Approved }` (or filter inside the `$lookup`/`$addFields` stage) so only approved reviews contribute to `totalRatings`/`totalReviews`/`averageRating`.
- **Why it's great for the report:** a genuine business-logic/data-integrity defect, perfect material for a **decision-table test** ("does review status ∈ {Waiting Approval, Approved, Rejected} affect whether it counts toward the average rating? Expected: only Approved should count").

### 🐛 Bug #4 — Wishlist endpoint accepts requests with no `product`, creating orphaned null-product records (LOW-MEDIUM severity, input-validation)
- **Symptom:** `POST /api/wishlist/` returns `200 success` even when the request body omits the `product` field (e.g. a client bug sends `{"isLiked": true}` or `{"productId": "..."}` — wrong field name). The server happily persists a `Wishlist` document with `product: null`.
- **Root cause:** `server/routes/api/wishlist.js`, lines 8–17:
  ```js
  router.post('/', auth, async (req, res) => {
    try {
      const { product, isLiked } = req.body;     // no validation that `product` is present/truthy
      const user = req.user;
      const update = { product, isLiked, updated: Date.now() };
      const query = { product: update.product, user: user._id };  // query becomes { product: null, user: ... }
      const updatedWishlist = await Wishlist.findOneAndUpdate(query, update, { new: true });
      // falls through to `new Wishlist({ product: null, isLiked, user })` and saves it
  ```
  There is no check that `product` is a non-empty value (or a valid `ObjectId`/existing product) before building the query and persisting. Each malformed request creates (or upserts onto) a `{ product: null, user: <id> }` wishlist record.
- **Verified:** sent `POST /api/wishlist/` with `{"productId": "<id>", "isLiked": true}` (a wrong-but-plausible field name) as the buyer test account → got `200 success`; confirmed via `db.wishlists.find({user: ObjectId("...")})` that a document `{ product: null, isLiked: true, user: ObjectId(...) }` was persisted. A second malformed call with a different `isLiked` value *updated the same orphaned record* (the `findOneAndUpdate` query `{ product: null, user }` matches it), so repeated bad requests silently collapse onto one polluted row instead of erroring loudly.
- **Impact:** silent data corruption — orphaned records with `product: null` will break any client code that assumes `wishlist.product` is populated (e.g. `populate('product')` returning `null`, then `.name`/`.price` access throwing on the frontend). Low severity on its own, but a textbook example of "the API trusts the client to send well-formed data."
- **Proposed fix:** validate `product` is present and a valid `ObjectId` referencing an existing `Product` before building `update`/`query`; return `400` with a clear message otherwise (mirrors how `address.js`/`order.js` *should* validate but don't either — a recurring pattern worth calling out in the static-analysis section).
- **Why it's great for the report:** a clean **equivalence-partitioning** story — partition the `product` field into {valid existing id} / {valid-format id of non-existent product} / {missing/null} / {malformed string} and show the API only handles the first partition correctly. Easy to write a red→green regression test around (`POST /api/wishlist/` with missing `product` → expect `400`, currently returns `200`).

### 🐛 Bug #5 — IDOR / Broken Object-Level Authorization: any authenticated user can cancel and delete *any other user's* order (HIGH severity, security/access-control)
- **Symptom:** `DELETE /api/order/cancel/:orderId` lets **any logged-in user — buyer, merchant, or admin, regardless of whether they placed the order** — permanently delete another user's order and cart simply by knowing (or guessing/enumerating) the order's MongoDB `_id`.
- **Root cause:** `server/routes/api/order.js`, lines 257–277:
  ```js
  router.delete('/cancel/:orderId', auth, async (req, res) => {
    try {
      const orderId = req.params.orderId;
      const order = await Order.findOne({ _id: orderId });        // <-- no `user: req.user._id` filter!
      const foundCart = await Cart.findOne({ _id: order.cart });
      increaseQuantity(foundCart.products);
      await Order.deleteOne({ _id: orderId });
      await Cart.deleteOne({ _id: order.cart });
      res.status(200).json({ success: true });
  ```
  The handler is gated only by `auth` (must be *logged in*, any role) — there is **no ownership check** comparing `order.user` to `req.user._id`, and no `role.check(ROLES.Admin)` either. Any authenticated principal can operate on any order document in the system. The sibling endpoint `PUT /api/order/status/item/:itemId` (lines 279+) has the **identical flaw**: `Cart.findOne({ 'products._id': itemId })` locates and mutates *whichever* cart happens to contain that item ID, with no check that it belongs to the requester.
- **Verified end-to-end (reproducible with curl):**
  1. Logged in as `buyer.test@example.com`, placed an order (`POST /api/order/add`) → order `_id = 6a258d9dac6b5200328d6447`, owned by the buyer's user id `6a258966...6438`.
  2. Logged in as `merchant.test@example.com` — a *completely unrelated* `ROLE MERCHANT` account that never touched this order or cart — and called `DELETE /api/order/cancel/6a258d9dac6b5200328d6447` with **its own** auth token.
  3. Server responded `200 {"success": true}`. Direct MongoDB inspection confirmed the buyer's order **and cart were deleted** — by a party with zero relationship to either document. (Earlier in the session, the same was reproduced with the *admin* account against the buyer's first order, which is at least role-defensible; repeating it with the unprivileged merchant account proves it's not an admin-override feature — it's a missing authorization check that affects every role.)
- **Impact:** textbook **OWASP API Security Top 10 — API1:2023 Broken Object Level Authorization (BOLA/IDOR)**. In production this would let any registered user cancel/destroy other customers' orders en masse (since Mongo `_id`s are largely sequential/guessable, or could be harvested from e.g. the `order/search` results of a compromised low-privilege account), causing real financial/reputational damage. This is the most severe bug found so far — a genuine security defect, not just a functional one.
- **Proposed fix:** change the lookup to scope by owner unless the requester is an admin, e.g. `const filter = req.user.role === ROLES.Admin ? { _id: orderId } : { _id: orderId, user: req.user._id }; const order = await Order.findOne(filter); if (!order) return res.status(404)...`. Apply the same pattern to `PUT /status/item/:itemId` (verify the cart's `user` matches `req.user._id` or the requester is an admin before mutating).
- **Why it's great for the report:** your **headline security finding** — perfect for a dedicated **access-control / decision-table test design** (axes: *requester role* {owner-buyer, other-buyer, merchant, admin} × *resource* {own order, someone else's order} → expected: only "owner" or "admin" should succeed, everything else should be `403`/`404`). Demonstrates you can find not just functional bugs but real OWASP-class vulnerabilities — a strong differentiator in the static-analysis/security-testing section, and a compelling live demo ("watch user B delete user A's order").

### 🐛 Bug #6 — `CATEGORY_SELECT` action constant referenced but never imported → guaranteed `ReferenceError` (LOW severity *today*, but a textbook static-analysis catch)
- **Found via:** static analysis (ESLint `no-undef`), **not** exploration — see [`static-analysis/STATIC_ANALYSIS_REPORT.md`](../static-analysis/STATIC_ANALYSIS_REPORT.md) Finding 4 for the full writeup.
- **Symptom:** `client/app/containers/Category/actions.js:52` builds `{ type: CATEGORY_SELECT, payload: value }`, but `CATEGORY_SELECT` is **not** in that file's import list from `./constants` (every sibling constant — `CATEGORY_CHANGE`, `CATEGORY_EDIT_CHANGE`, etc. — *is* imported; this one was dropped, almost certainly a copy/paste slip). `CATEGORY_SELECT` **is** correctly defined/exported in `constants.js:16`.
- **Root cause:** missing identifier in a destructured `import {...} from './constants'` statement → `categorySelect()` throws `ReferenceError: CATEGORY_SELECT is not defined` the instant it's invoked.
- **Reachability:** `grep -rn "categorySelect"` across the whole client finds **only the definition** — nothing currently dispatches it. It's latent dead code today; the crash is 100% guaranteed the moment a future feature wires a "select category" UI element to this already-exported, looks-correct action creator.
- **Proposed fix:** one-line — add `CATEGORY_SELECT` to the import list.
- **Why it's great for the report:** the cleanest possible illustration of *why static analysis matters as a V&V activity distinct from dynamic testing* — this defect is **unreachable through any UI flow today**, so no amount of black-box/system/exploratory testing would ever surface it, yet it's a guaranteed crash waiting to ship. Pair this explicitly with Bugs #1-#5 (all found via dynamic exploration/code-reading) to show you exercised *both* static and dynamic techniques and that they catch genuinely different defect classes — exactly the kind of methodological point that impresses graders.

## 4. How the merchant test account was created (useful for your test-plan write-up)

This sequence is worth documenting as-is — it's effectively a manual integration test you already performed:
1. `POST /api/merchant/add` with name/business/phone/email/brandName → creates a `Merchant` doc with `status: "Waiting Approval"`, fires (unconfigured) Mailgun email
2. `PUT /api/merchant/approve/:id` (as admin) → flips merchant to `Approved`/`isActive`, internally calls `createMerchantUser` which creates a `User` with role `ROLE MERCHANT` and a `resetPasswordToken` (normally emailed as a signup link)
3. Since Mailgun isn't configured, the token was read directly from MongoDB: `db.users.findOne({email: "..."}, {resetPasswordToken: 1})`
4. `POST /api/merchant/signup/:token` with the token + new password → completes the account, triggers `createMerchantBrand`
5. Verified login with the new merchant credentials returns role `ROLE MERCHANT`

This is exactly the kind of multi-step, multi-model flow that deserves an **integration test** — and the email-bypass-via-DB approach is your documented justification for how you'll handle Mailgun-dependent flows generally (see TODO §1, "decide & document Mailgun approach").

## 5. Next steps (in suggested order)

- [ ] **File all five bugs *and* the regex-injection static-analysis finding as GitHub Issues** on the fork (`Bakir29/mern-ecommerce_SVVT`) — see `04_Bug_Tracking_and_Fixes.md` for the issue → fix → linked-commit pipeline. Recommended order by impact: **#5 (IDOR/security) → #1 (broken browsing) → #3 (rating integrity) → #2 (broken email) → #4 (input validation)**.
- [ ] **Fix Bug #5 first** — it's the most severe (security/access-control) and the best demo material; write an access-control test matrix (owner/other-user/admin × own-order/others'-order) as a decision table, red→green around the ownership filter fix. Also patch the twin flaw in `PUT /status/item/:itemId`.
- [ ] **Fix Bug #1**, write an integration test for `GET /api/product/list` with no rating param (red before fix → green after) — your strongest *functional* regression-testing evidence
- [ ] **Fix Bug #3**, write a decision-table-driven test over review status × whether it counts toward `averageRating`
- [ ] **Fix Bug #2**, and consider whether to also address the swallowed-error pattern in `mailgun.js` (could become a 6th, smaller "bug" tied to your static-analysis findings)
- [ ] **Fix Bug #4**, write an equivalence-partitioning test over the `product` field (valid id / non-existent id / missing / malformed)
- [ ] Optional further exploration: merchant-side brand/product management as a merchant role, responsiveness/UI checks — lower priority, the 5 bugs found already give excellent, varied report material (functional, business-logic, security, input-validation, integration)
- [ ] Move to **Phase 2**: pick a static analysis tool for this Node/React stack (ESLint + `eslint-plugin-security` or SonarCloud are good fits — see `02_Static_Analysis_and_Test_Design.md`) and start drafting the formal test plan (scope, environment, EP/BVA/decision-table test case designs)

## 6. Exploration log (for traceability — what's been poked at so far)

- ✅ Auth: register (buyer), login (admin/buyer/merchant), merchant application → approval → token signup
- ✅ Product browsing/listing (`/api/product/list`) — found Bug #1
- ✅ Cart: add item (`/api/cart/add`) — works once correct payload shape (`products: [{product, quantity, price, taxable}]`) is known
- ✅ Orders: place order from cart (`/api/order/add`) — works; led to discovering Bug #2 via code reading; **order cancellation (`DELETE /cancel/:orderId`) led to discovering Bug #5 (IDOR)**
- ✅ Reviews: submit review (`/api/review/add`) — works, enters moderation queue; led to discovering Bug #3
- ✅ Wishlist (`POST /api/wishlist/`) — found Bug #4 (orphaned null-product records from malformed input)
- ✅ Address book (`POST /api/address/add`) — works correctly once the flat schema shape (`{address, city, state, zipCode, country, isDefault}`, no `firstName`/`lastName`/`phoneNumber` — those aren't on this model) is used; no defect found here, just a payload-shape learning curve on my end
- ✅ Admin user search (`GET /api/user/search`) — works correctly; access control verified: a buyer (`ROLE MEMBER`) attempting the same call gets a proper `403 "You are not allowed to make this request."` — **a nice positive control confirming role-based access *is* correctly enforced elsewhere**, which makes the total *absence* of such a check on order cancellation (Bug #5) stand out even more starkly as an oversight rather than a missing feature
- ⬜ Merchant-side brand/product management, responsiveness/UI — not yet explored (lower priority; current bug set already spans functional, business-logic, security/access-control, and input-validation categories — a strong, varied portfolio for the report)

**Notable side-finding:** `POST /api/order/add` does not validate that `cartId`/`total` are present either — an empty `{}` body still creates an `Order` document with `cart: undefined, total: 0`. Same "trusts client input" pattern as Bug #4; not write-up-worthy as its own bug but reinforces the case that **input validation is a systemic gap** worth a dedicated static-analysis/code-review paragraph in the report (could be framed as "we found the same class of defect — missing request-body validation — in 3 different routes: wishlist, order/add, and indirectly order/cancel").
