# Outfleek — Animated E‑Commerce Platform for Bangladesh

> **Live store:** https://outfleek.vercel.app · **Repository:** https://github.com/vampxlr/outfleek

A production e‑commerce platform built with **Next.js 15**, **Convex**, and **Framer Motion**, designed for the Bangladeshi market: **Cash on Delivery** and **bKash** payments, a fully configurable **admin panel**, a **Facebook‑ad landing‑page builder**, and correct **Meta Pixel + Conversions API** tracking.

This repository is also a **teaching project**. It ships with a complete software‑testing lab report (black box + white box), a unit test suite, and a step‑by‑step tutorial.

---

## Table of contents

| Document | What it is |
|---|---|
| [`docs/LAB-REPORT.md`](docs/LAB-REPORT.md) / [`docs/LAB-REPORT.pdf`](docs/LAB-REPORT.pdf) | Testing & Validation Report — black box + white box test cases with screenshots |
| [`docs/TUTORIAL.md`](docs/TUTORIAL.md) | Learn‑the‑project tutorial for students |
| [`docs/presentation/index.html`](docs/presentation/index.html) | Animated glassmorphism slide deck (2 presenters × 10 min) |
| [`REQUIREMENTS.md`](REQUIREMENTS.md) | Original product requirements |
| [`graphify-out/graph.html`](graphify-out/graph.html) | Interactive knowledge graph of the codebase |

---

## Features

**Storefront** — home page *is* the product listing (filter pills, sort, animated grid) · product detail with image gallery, size/colour variants and stock awareness · slide‑in cart drawer · cart page with promo codes and a free‑delivery progress bar · checkout with COD + manual bKash · order tracking timeline.

**Admin panel** (`/admin`) — live dashboard · order management (status workflow, bKash verification, courier fields, printable invoice) · abandoned‑checkout call list · product CRUD with image upload *and* external image URLs · categories · promo codes · every setting runtime‑configurable (delivery fees, bKash number, Pixel credentials) · CAPI tracking debug page.

**Landing‑page builder** — create a one‑page Facebook‑ad funnel for any single product at your own URL (`/l/your-slug`): hero, benefits, gallery, reviews, countdown offer, size chart, FAQ, and an inline order form that completes the purchase without a cart. Per‑page price overrides and view/initiate/order/CVR stats.

**Tracking** — one shared `event_id` per event across browser Pixel and server CAPI (correct deduplication), server‑side SHA‑256 hashing of PII, `fbclid` → `_fbc` capture, retry queue, and Purchase sent from the server so orders never depend on Meta being up.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) + TypeScript |
| Backend / DB | Convex (queries, mutations, actions, scheduler, file storage) |
| Animation | Framer Motion |
| Styling | Tailwind CSS v4 |
| State | Zustand (persisted cart) |
| Testing | Vitest + @vitest/coverage-v8, Playwright (screenshots) |
| Hosting | Vercel + Convex Cloud |

---

## Getting started

```bash
git clone https://github.com/vampxlr/outfleek.git
cd outfleek
npm install

# 1. Create your own Convex backend (writes .env.local for you)
npx convex dev            # leave running in terminal 1

# 2. Seed sample data (in another terminal)
npx convex run seed:run

# 3. Set an admin password
npx convex env set ADMIN_PASSWORD your-password-here

# 4. Start the app
npm run dev               # terminal 2 → http://localhost:3000
```

Then visit `http://localhost:3000` for the store and `http://localhost:3000/admin` to log in.

## Testing

```bash
npm test                  # run the unit test suite
npm run test:coverage     # run with a coverage report
npm run test:watch        # watch mode
node scripts/capture-screenshots.mjs   # regenerate report screenshots (needs the dev server running)
```

Current status: **81 unit tests passing**, **98.63 % statement coverage** across the tested modules (`lib/pricing.ts` and `lib/validation.ts` at 100 %).

## Project layout

```
app/                 Next.js routes (storefront, /admin, /l/[slug] landing pages)
components/          store/, admin/, landing/ React components
convex/              schema.ts + all backend functions (orders, products, capi, …)
lib/                 pure logic: pricing.ts, validation.ts, cart.ts, tracking.ts
tests/unit/          Vitest unit tests
docs/                lab report, tutorial, presentation, screenshots
scripts/             seed/import/screenshot utilities
designs/             the five original HTML design prototypes
```

## License

MIT — free to learn from and build on.
