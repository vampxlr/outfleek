# Collected Test Evidence (raw)

Generated during the testing session. All results below were **actually executed**
against the running Convex development deployment `handsome-hornet-178`
and the Vitest suite — none are hypothetical.

## A. Unit test execution (Vitest)

```
 Test Files  3 passed (3)
      Tests  81 passed (81)
   Duration  219ms

 % Coverage report from v8
---------------|---------|----------|---------|---------|-------------------
File           | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
---------------|---------|----------|---------|---------|-------------------
All files      |   98.63 |    98.24 |   96.42 |   98.38 |
 cart.ts       |   96.15 |     90.9 |   94.11 |   95.45 | 59
---------------|---------|----------|---------|---------|-------------------
Statements   : 98.63% ( 72/73 )
Branches     : 98.24% ( 56/57 )
Functions    : 96.42% ( 27/28 )
Lines        : 98.38% ( 61/62 )
```

Per-module (from coverage/coverage-summary.json):

| Module | Stmts | Branch | Funcs | Lines |
|---|---|---|---|---|
| lib/pricing.ts | 100% (20/20) | 100% | 100% | 100% |
| lib/validation.ts | 100% (27/27) | 100% | 100% | 100% |
| lib/cart.ts | 96.15% (25/26) | 90.9% | 94.11% | 95.45% (line 59 = `setDrawer`) |
| **Total** | **98.63%** | **98.24%** | **96.42%** | **98.38%** |

Test case counts: pricing.test.ts = 30, validation.test.ts = 31, cart.test.ts = 11. Total 81 (some `it()` blocks are generated in loops, hence the runner reports 81).

## B. Cyclomatic complexity (counted by decision points)

| Function | File | CC | Decision points |
|---|---|---|---|
| validateCheckout | lib/validation.ts:78 | 12 | 6 `if` + 5 `\|\|` |
| calcDiscount | lib/pricing.ts:57 | 5 | 2 `if` + 1 `&&` + 1 ternary |
| calcDeliveryFee | lib/pricing.ts:75 | 4 | 2 `if` + 1 ternary |
| normalizeBDPhone | lib/validation.ts:30 | 4 | 2 `if` + 1 `&&` |
| generateOrderNo | lib/validation.ts:47 | 3 | 2 `??` |
| calcSubtotal / calcTotal / isValidBDPhone / isValidSlug / freeDeliveryRemaining | — | 1 | none |

## C. Black-box API probes (12) — real results

Client-visible errors are masked by Convex as "Server Error"; the real messages
below were read from the deployment's function logs.

| ID | Scenario | Expected | Actual (from deployment logs) | Status |
|---|---|---|---|---|
| BB-API-01 | Order with malformed phone `01123456789` | Reject | `Error: Invalid phone number` at convex/orders.ts:48 | Pass |
| BB-API-02 | Order with empty cart | Reject | `Error: Cart is empty` at convex/orders.ts:51 | Pass |
| BB-API-03 | Order qty 9999 (> stock) | Reject | `Error: Out of stock: Noir Pinstripe Bloom Shirt (M)` at orders.ts:71 | Pass |
| BB-API-04 | Order non-existent size `XXXL` | Reject | `Error: Variant unavailable: Noir Pinstripe Bloom Shirt XXXL` at orders.ts:69 | Pass |
| BB-API-05 | Validate promo `NOTREAL2026` | `{valid:false}` | `{"reason":"Invalid code","valid":false}` | Pass |
| BB-API-06 | Track order with wrong phone | `null` (no leak) | `null` | Pass |
| BB-API-07 | Admin query with bogus token | Reject | `Error: Unauthorized` at convex/orders.ts:255 | Pass |
| BB-API-08 | Create landing page, invalid slug + bogus token | Reject | `Error: Unauthorized` at landingPages.ts:119 | Pass (see Obs-2) |
| BB-API-09 | Public settings must hide CAPI token | no `capiToken` key | `{"hasCapiToken":false,"storeName":"Outfleek"}` | Pass |
| BB-API-10 | Fetch published landing page | page + product | `{slug:"noir-bloom-offer",status:"published",price:1290,sections:8}` | Pass |
| BB-API-11 | Fetch non-existent landing page | `null` | `null` | Pass |
| BB-API-12 | Abandoned checkout, invalid phone | ignored | `null`, nothing stored | Pass |

## D. Transaction atomicity test

Order containing item 1 = valid (qty 2) and item 2 = out of stock (qty 99999):

```
BEFORE: Noir Pinstripe Bloom Shirt M = 19 | Sky Doodle Blossom Shirt M = 20
  -> mutation REJECTED (expected)
AFTER:  Noir Pinstripe Bloom Shirt M = 19 | Sky Doodle Blossom Shirt M = 20
ATOMICITY: PASS - item 1's stock decrement was rolled back
```

## E. Price-tampering security test

```
Real catalogue price of Noir Pinstripe Bloom Shirt = BDT 1490
Client sent priceOverride: 1  (attacker attempts to pay BDT 1)
Order created: LX-20260819-9664  subtotal = 1490  total = 1570
PASS - server ignored the forged price and used the catalogue price
```

## F. Free-delivery threshold, end-to-end

Settings: threshold BDT 2000, Dhaka fee BDT 80, unit price BDT 1490.

```
qty=1  subtotal=1490  (>=2000? false)  deliveryFee=80  total=1570   LX-20260819-9218  PASS
qty=2  subtotal=2980  (>=2000? true)   deliveryFee=0   total=2980   LX-20260819-2374  PASS
```

## G. Observations / defects raised

- **Obs-1 (Medium, code quality → latent security risk):** `orders.place` declares a
  public argument `priceOverride: v.optional(v.number())` (convex/orders.ts:32) that the
  handler never reads — the unit price is taken from the database
  (`landing.priceOverride` / `p.price`, lines 76–79). The argument is dead. Confirmed by
  test E: sending `priceOverride: 1` had no effect. It should be removed, because a future
  developer could "wire it up" and introduce a price-tampering vulnerability.
- **Obs-2 (Informational):** in `landingPages.create` the authorisation check runs before
  slug-format validation (landingPages.ts:117–119), so BB-API-08 could not exercise the
  slug rule without a valid token. The ordering is correct (fail-closed); the slug rule is
  covered instead by the unit tests for `isValidSlug`.
- **Obs-3 (Low):** `lib/cart.ts` line 59 (`setDrawer`) is the only uncovered statement in
  the suite — a pure UI state setter with no logic.
