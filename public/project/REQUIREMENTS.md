# T-Shirt E-Commerce Platform — Requirements

Design: **Option 1 — Minimal Luxe** (approved prototype in `designs/`).
Market: Bangladesh. Currency: ৳ BDT. Catalog: small (a few shirts), built to grow.

---

## 1. Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 15 (App Router) + TypeScript | SEO for product pages, server components, API routes for CAPI |
| Animation | Framer Motion | Page transitions, scroll reveals, cart drawer, micro-interactions |
| Styling | Tailwind CSS (tokens extracted from Minimal Luxe design) | Fast, consistent |
| Database/backend | **Convex** (queries/mutations/actions, schema in `convex/schema.ts`) | Realtime admin dashboard out of the box, scheduled functions for CAPI retry queue, no ORM layer |
| Auth (admin only) | Convex Auth (password) — single admin role, later staff roles | No customer accounts needed for COD flow |
| Hosting | Vercel (frontend) + Convex cloud (backend) | Easy deploys, edge, image optimization |
| Images | Convex file storage (admin uploads product photos) + Next Image | One platform, no extra service |

No customer login required to order (guest checkout only — critical for BD COD conversion).

## 2. Storefront (customer-facing)

### 2.1 Pages
- **Home = product listing** (as designed): filter pills, sort, product grid, cart drawer.
- **Product detail** `/product/[slug]`: gallery, size/color, qty, Add to Cart, **Order Now** (skip to checkout), tabs (description / size guide / delivery & returns), related products.
- **Cart** `/cart`: qty edit, remove, promo code, delivery-fee logic, free-delivery progress bar.
- **Checkout** `/checkout`: name, phone (BD validation `01[3-9]XXXXXXXX`), address, delivery area (inside/outside Dhaka), notes; payment = **COD** (default) or **bKash** (manual send-money: show admin-configured bKash number, collect payer number + TrxID). Success page with order number.
- **Order tracking** `/track/[orderNo]` (phone + order number lookup) — status timeline.
- **Landing pages** `/l/[slug]` — see §4.
- Static: About / Return policy / Privacy (required for Facebook ad approval).

### 2.2 Cart & pricing rules
- Cart persisted (localStorage + synced on checkout).
- Delivery fee: configurable per zone (default ৳80 Dhaka / ৳130 outside), free above configurable threshold (default ৳2000).
- Promo codes: percent or fixed amount, usage limit, expiry, min order value.
- Product variants: size (S–XXL) and color, **per-variant stock**; out-of-stock variants disabled.

### 2.3 UX requirements
- Mobile-first (most BD Facebook traffic is mobile); test at 390px.
- LCP < 2.5s on 4G; images lazy-loaded and sized; grid 2-col on mobile.
- Sticky add-to-cart bar on product page (mobile).
- Bangla-friendly: numerals/currency shown as ৳; optional Bangla labels later (i18n-ready copy file, English first).

## 3. Orders & Payments

- Order lifecycle: `Pending → Confirmed → Packed → Shipped → Delivered` + `Cancelled`, `Returned` (COD refusal is common — track return reason).
- **COD**: order lands as Pending; admin confirms by phone (standard BD flow).
- **bKash (manual, v1)**: customer sends money to configured number, submits payer number + TrxID; order flagged "payment claimed" until admin verifies. **v2**: bKash PGW (tokenized checkout API) integration behind a feature flag — schema must already have `paymentProvider`, `transactionId`, `paidAt`.
- Incomplete checkout capture: if name+phone entered but not submitted, save as **abandoned/incomplete order** for call-back recovery (big COD revenue lever).
- Courier: fields for courier name + tracking ID; v2 API integration (Pathao/Steadfast/RedX) behind adapter interface.
- Invoice: printable packing slip/invoice per order.

## 4. Landing Pages (Facebook ad → one-page funnel) ⭐

Admin can create a standalone selling page for **one specific product**, with its own URL, without code:

- **URL**: `/l/[slug]` — slug fully editable in admin (e.g. `/l/eid-premium-black`). Duplicate-slug protection; optional custom OG title/description/image per page.
- **Builder (v1 = structured template, not drag-drop)**: admin picks the product and fills ordered, toggleable sections:
  1. Hero (headline, subheadline, image/video, CTA text)
  2. Pain/benefit bullets
  3. Product gallery
  4. Social proof (review screenshots/photos upload, star ratings)
  5. Offer block (price, compare-at, countdown timer optional, stock scarcity optional)
  6. Size chart
  7. FAQ (repeatable Q/A)
  8. **Inline order form** (name, phone, address, size, qty, delivery area, COD/bKash) — the whole funnel completes on ONE page, no cart, no navigation away.
- Per-landing-page overrides: price/discount, delivery fee, headline pixel event value.
- Status: draft / published; duplicate-a-page; per-page stats (views, initiate, orders, conversion rate) on the admin dashboard.
- Multiple simultaneous landing pages for different ads/audiences testing the same product.
- No header/footer nav (leak-proof funnel) except minimal footer with policy links (Facebook compliance).

## 5. Admin Panel (`/admin`)

### 5.1 Dashboard
Today/7d/30d: orders, revenue, pending-confirmation count, abandoned checkouts, per-landing-page conversion.

### 5.2 Catalog
- Products CRUD: name, slug, description, images (multi-upload, drag-sort), category, price, compare-at price, cost (for profit reporting), variants (size × color) with per-variant stock, active/hidden, badges (New/Hot/Sale).
- Categories CRUD (the filter pills on home are driven by this).

### 5.3 Orders
List with filters (status, payment method, date, landing page source), search by phone/order no; detail view with status changes, bKash TrxID verification, courier fields, internal notes, call log note; abandoned-checkout list with "mark contacted".

### 5.4 Landing pages
Full CRUD per §4.

### 5.5 Marketing
Promo codes CRUD; announcement bar text; hero headline/tagline.

### 5.6 Settings (all runtime-configurable, no redeploy)
- Store: name, logo, contact phone/WhatsApp, social links, footer text.
- Delivery: zone fees, free-delivery threshold.
- Payments: COD on/off, bKash on/off, **bKash receive number**, bKash instructions text.
- Tracking: **Pixel ID, CAPI access token, test_event_code (with on/off toggle)** — token stored server-side only, never sent to the browser.
- Policies: return/privacy page content (simple rich text).

## 6. Tracking — Meta Pixel + CAPI (built-in, first-class)

Architecture: browser Pixel + server-side CAPI from a Next.js API route (direct to Graph API `POST /{pixel_id}/events`; sGTM/Stape not needed for v1 but keep the event payload shape compatible).

**Non-negotiable invariants:**
1. **One `event_id` per real event**, generated client-side (uuid) and sent to BOTH Pixel and CAPI — this is the dedup key. Two IDs = double counting; none = double counting.
2. **Raw PII (name/phone/address) goes only to our server**; SHA-256 hash `ph` (normalized to `8801XXXXXXXXX`), `fn`, `ln`, `ct`, `zp` there before calling Meta. Never hash in the browser, never log raw payloads.
3. **fbclid capture**: on first landing, store `fbc`/`fbp` cookies (first-party), pass through checkout to CAPI — this is the biggest EMQ lever for a COD store where email is absent. Also send `client_ip_address` + `client_user_agent` on every server event.
4. `external_id` = hashed phone (stable customer key for COD market).

**Events (Pixel + CAPI, deduped):** `PageView`, `ViewContent` (product + landing pages, with `content_ids`, `value`, `currency: BDT`), `AddToCart`, `InitiateCheckout`, `AddPaymentInfo` (payment method chosen), `Purchase` (fired on order placement — server-side is source of truth; `event_id = order number`). Optional custom `PhoneConfirmed` sent server-side when admin confirms a COD order (for optimizing on confirmed orders, not just placed ones).

**Admin/test tooling:** test_event_code toggle in settings (auto-strip in production mode), a "tracking debug" admin page showing last 20 CAPI responses + errors, EMQ reminder checklist. Landing pages send `content_name = landing slug` so ad-level reporting maps cleanly.

**Consent/compliance:** no EU traffic assumed (BD market) — consent mode out of scope v1.

## 7. Non-functional

- **Performance**: ISR/static product + landing pages; admin changes revalidate on save.
- **SEO**: per-page meta + OG tags, product structured data (JSON-LD), sitemap, canonical URLs.
- **Security**: admin behind auth + rate limiting; checkout rate-limited + honeypot (fake-order spam is common in BD COD); CAPI token and bKash secrets server-side env/DB only.
- **Reliability**: order writes transactional with stock decrement; CAPI calls queued/retried (order must never fail because Meta is down).
- **Backups**: daily DB backup.
- **Analytics**: order source attribution — store `utm_*`, `fbclid`, landing slug on every order.

## 8. Data model (Convex tables)

`products` (variants embedded as array — small catalog), `categories`, `orders` (items embedded), `abandonedCheckouts`, `landingPages` (sections embedded as ordered array), `promoCodes`, `settings` (key-value), `capiLogs`, plus Convex Auth tables for admin. Product images in Convex file storage, referenced by `_storage` IDs.

Convex-specific notes:
- **Purchase flow** = single mutation: validate stock → decrement → insert order → schedule CAPI action (`ctx.scheduler.runAfter(0, ...)`) so the order write never blocks on Meta.
- **CAPI calls** run in Convex actions with retry via scheduler; responses logged to `capiLogs` (powers the admin tracking-debug page).
- **Secrets** (CAPI token, bKash number if desired) in Convex environment variables / settings table — never shipped to the client.
- Admin dashboard uses Convex reactive queries — live order feed with zero polling.
- ISR less critical: product/landing pages can be client-reactive; keep server-rendered metadata (OG/JSON-LD) via Next server components fetching Convex.

## 9. Phasing

- **Phase 1 (MVP)**: storefront (4 designed pages) + orders (COD + manual bKash) + admin (products, orders, settings) + Pixel/CAPI + **one landing-page template with admin-editable slug/content**.
- **Phase 2**: promo codes, abandoned-checkout recovery, order tracking page, per-landing-page stats, invoice printing.
- **Phase 3**: bKash PGW API, courier API, Bangla i18n, staff roles, richer landing-page section library.
