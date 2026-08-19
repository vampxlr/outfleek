# The Outfleek Tutorial — Learn a Real Full-Stack Store from the Inside

Welcome. This document walks you through **Outfleek**, a real, deployed e-commerce
platform for Bangladesh (Next.js 15 + Convex + Framer Motion). It is not a toy —
it takes real orders, talks to Meta's ad platform, and handles real money (COD +
bKash). That's exactly why it's worth studying: everything you'll see here exists
because of a real constraint, not a textbook example.

You (the reader) know HTML/CSS/JS and a bit of React, but you haven't shipped a
full production app yet — with a real database, real payments, and real
third-party APIs. By the end of this tutorial you should be able to:

- Explain what each of the three "surfaces" of this app does and why they're separate.
- Read `convex/schema.ts` and know what an index is for.
- Trace an order from "customer clicks Place Order" to "row exists in the database" to "Meta sees the sale."
- Explain *why* prices are never trusted from the browser.
- Point at a Framer Motion prop and say what it animates and why.
- Explain event deduplication (`event_id`) well enough to teach it to someone else.
- Write a unit test for a new pricing rule.
- Make small, safe changes to the codebase (the Exercises chapter will make you actually do this).

> 💡 **How to use this tutorial**: Read a chapter, then open the real file it
> references in your editor and read it side-by-side. Don't just trust the
> snippets here — they're trimmed for clarity. Go look at the whole function.

---

## Table of Contents

0. [Getting the project running](#0-getting-the-project-running)
1. [The big picture](#1-the-big-picture)
2. [Next.js App Router basics as used here](#2-nextjs-app-router-basics-as-used-here)
3. [Convex: the backend](#3-convex-the-backend)
4. [State on the client](#4-state-on-the-client)
5. [Animation with Framer Motion](#5-animation-with-framer-motion)
6. [Payments & the Bangladeshi context](#6-payments--the-bangladeshi-context)
7. [The landing-page builder](#7-the-landing-page-builder)
8. [Meta Pixel + Conversions API](#8-meta-pixel--conversions-api)
9. [Testing](#9-testing)
10. [Deployment](#10-deployment)
11. [Exercises](#11-exercises)
12. [Glossary](#12-glossary)

---

## 0. Getting the project running

```bash
git clone https://github.com/vampxlr/outfleek.git
cd outfleek
npm install

# 1. Create your own Convex backend — this writes .env.local for you
#    (NEXT_PUBLIC_CONVEX_URL + deployment credentials). Leave this running.
npx convex dev

# 2. In a second terminal, seed some sample products/categories
npx convex run seed:run

# 3. Set an admin password (stored as a Convex environment variable,
#    never in your code, never in .env.local)
npx convex env set ADMIN_PASSWORD your-password-here

# 4. Start the Next.js dev server
npm run dev   # -> http://localhost:3000
```

Visit `http://localhost:3000` for the store, and `http://localhost:3000/admin`
to log in with the password you set in step 3.

Two things worth noticing immediately:

- `npx convex dev` isn't optional background noise — it's a **live connection**
  to your database that also pushes your `convex/*.ts` files as backend code
  every time you save. If it's not running, nothing works, not even in dev.
- The seed script (`convex/seed.ts`) is a normal Convex **mutation** —
  `ctx.db.query("products").first()` guards it so running it twice does nothing.

💡 **Why this matters**: in most tutorials "run the backend" and "run the
frontend" are two unrelated commands talking over HTTP. Here they're two
processes cooperating over the *same* generated TypeScript types
(`convex/_generated/api`) — which is why Convex feels less like "a database"
and more like "an extension of your app."

---

## 1. The big picture

Outfleek is not one app — it's **three surfaces** sharing one backend:

| Surface | Route | Audience | Purpose |
|---|---|---|---|
| **Storefront** | `/`, `/product/[slug]`, `/cart`, `/checkout`, `/track` | Shoppers | Browse, add to cart, pay with COD/bKash, track order |
| **Admin panel** | `/admin/*` | The store owner | Manage products, orders, settings, tracking |
| **Landing pages** | `/l/[slug]` | Facebook ad traffic | One product, one page, one form — no navigation away |

All three talk to the same Convex backend, and Convex talks to one outside
system: Meta's Conversions API (CAPI), for ad tracking.

```
┌──────────────┐      ┌──────────────┐      ┌──────────────────┐
│   Browser    │◄────►│   Next.js    │◄────►│      Convex       │
│ (store/admin/│ HTTP │  App Router  │ WS/  │  (DB + functions   │
│  landing pg) │      │ (React 19)   │ RPC  │   + scheduler)     │
└──────────────┘      └──────────────┘      └─────────┬─────────┘
                                                        │ scheduled
                                                        │ action
                                                        ▼
                                              ┌───────────────────┐
                                              │  Meta Graph API    │
                                              │  (Conversions API) │
                                              └───────────────────┘
```

The browser mostly doesn't talk to a REST API in the traditional sense — it
holds an open connection to Convex and gets pushed new data automatically
(that's "reactivity", covered in Chapter 3).

### Why Convex instead of REST + Postgres?

A traditional stack would be: Next.js API routes → an ORM (Prisma/Drizzle) →
Postgres → manually wire up polling or websockets for the live admin
dashboard → a separate job queue (e.g. BullMQ + Redis) for retrying the CAPI
calls. That's four moving pieces, three of which need their own hosting and
their own failure modes.

Convex collapses all of that:

- **Reactivity built in** — the admin order list (`convex/orders.ts` →
  `adminList` query) is a normal `useQuery` call in React. When a new order
  comes in, every open admin tab updates instantly, with *zero* polling code
  written by hand.
- **The scheduler replaces the job queue** — `ctx.scheduler.runAfter(0, ...)`
  (used to fire the Meta Purchase event) *is* the background job system. No
  Redis, no separate worker process.
- **File storage built in** — product photos go straight into Convex storage
  (`ctx.storage.generateUploadUrl()`), no S3 bucket to configure.
- **No ORM / no migrations** — `convex/schema.ts` *is* the schema, checked by
  TypeScript and enforced at write time. There's no `schema.prisma` and no
  `npx prisma migrate` step that can drift from the code.

💡 **Why this matters**: for a two-person team shipping a COD store for the
Bangladeshi market, every piece of infrastructure you *don't* have to run is
one less thing that can go down at 11pm while someone's placing an order.

---

## 2. Next.js App Router basics as used here

Next.js's **App Router** turns folders under `app/` into routes. Look at the
real folder structure:

```
app/
  page.tsx                  ->  /            (home = product listing)
  layout.tsx                    (wraps every page)
  providers.tsx                 (client-side context, see below)
  product/[slug]/page.tsx   ->  /product/essential-black-tee
  cart/page.tsx              ->  /cart
  checkout/page.tsx          ->  /checkout
  track/page.tsx             ->  /track
  l/[slug]/page.tsx          ->  /l/eid-premium-black   (landing pages)
  admin/page.tsx             ->  /admin
  admin/orders/page.tsx      ->  /admin/orders
  (policies)/privacy/page.tsx -> /privacy   (the parens = "don't add to the URL")
```

`[slug]` is a **dynamic route segment** — Next.js gives your component a
`params.slug` for whatever the visitor typed. `app/product/[slug]/page.tsx`
is what renders for *any* product; it reads the slug and asks Convex for that
one product (`api.products.bySlug`).

### Server components vs. client components — and why this app is (almost) all client

By default, App Router components are **Server Components**: they render on
the server, ship zero JS for their own logic, and can't use `useState`,
`useEffect`, or browser-only APIs. To opt a component *and everything it
renders* into the browser, you add the `"use client"` directive at the top of
the file.

Nearly every page in this codebase starts with:

```tsx
"use client";
```

Why? Because this whole app is built around **live Convex queries**
(`useQuery`), **browser state** (the Zustand cart, `localStorage`), and
**browser-only tracking** (`window.fbq`, cookies, `sessionStorage`) — all of
which require the client. A server component *could* fetch the initial
product list once, but then it couldn't reactively update when the admin
changes a price, and it couldn't read the cart from `localStorage`. For a
small, fast-moving catalog like this one, trading away server rendering for
"always live everywhere" is the right call.

`app/layout.tsx` is the one truly top-level piece — it's a Server Component
that sets the page `<html>`/`<body>` and global `<Metadata>` (title,
description — used for SEO and the link preview when the store is shared).
It wraps everything in `<Providers>`:

```tsx
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

`app/providers.tsx` is where the client boundary actually starts. It does two jobs:

```tsx
// app/providers.tsx (trimmed)
export function Providers({ children }: { children: ReactNode }) {
  const client = useMemo(
    () => new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL as string),
    []
  );
  return (
    <ConvexProvider client={client}>
      <Tracking>{children}</Tracking>
    </ConvexProvider>
  );
}
```

1. Creates **one** `ConvexReactClient` and hands it to every page via
   `ConvexProvider` — this is what makes `useQuery(api.products.list, {})`
   work anywhere in the tree.
2. Wraps everything in `<Tracking>`, a component that fires the Meta Pixel
   `PageView` event (and its server-side twin) on every route change — more
   on this in Chapter 8.

💡 **Why this matters**: `"use client"` isn't a style choice, it's a
trade-off. Understanding *why* almost every file here has it (live data +
browser APIs) is more valuable than memorizing the rule "add it when you get
an error."

---

## 3. Convex: the backend

### The mental model

Convex backend code lives entirely in `convex/*.ts`. There are four building blocks:

| Block | What it is | Example in this repo |
|---|---|---|
| **schema** | Declares tables, field types, and indexes | `convex/schema.ts` |
| **query** | A reactive *read*. Runs in a sandbox, can only read the DB. Client `useQuery` calls re-run automatically when data changes. | `products.list`, `orders.dashboard` |
| **mutation** | A transactional *write*. Runs atomically — either the whole thing succeeds or none of it does. | `orders.place`, `products.update` |
| **action** | Can call the outside world (fetch, crypto, npm packages) but is *not* transactional and can't touch the DB directly — it calls queries/mutations to do that. | `capi.sendEvent` (talks to Meta) |
| **scheduler** | Queues a mutation/action to run later (even `0` ms later = "right after this"), outside the current transaction. | `ctx.scheduler.runAfter(0, internal.capi.sendEvent, ...)` |

### Reading `convex/schema.ts`: `products` and `orders`

```ts
products: defineTable({
  name: v.string(),
  slug: v.string(),
  description: v.string(),
  categoryId: v.optional(v.id("categories")),
  price: v.number(),                 // BDT
  compareAtPrice: v.optional(v.number()),
  cost: v.optional(v.number()),
  imageIds: v.array(v.id("_storage")),
  imageUrls: v.optional(v.array(v.string())),
  variants: v.array(variant),        // { size, color, stock }
  badges: v.array(v.string()),
  active: v.boolean(),
  placeholderHue: v.optional(v.number()),
})
  .index("by_slug", ["slug"])
  .index("by_active", ["active"]),
```

- `variants` is an **embedded array**, not a separate table. There's no
  `product_variants` join table — because the catalog is small and a variant
  never needs to be queried independently of its product, embedding is
  simpler and faster than a relational join would be.
- `v.id("_storage")` is a Convex file-storage reference — the actual image
  bytes live in Convex's blob storage, and the DB just holds an ID you can
  turn into a URL with `ctx.storage.getUrl(id)`.
- **Indexes** (`by_slug`, `by_active`) exist because Convex, like any
  database, can only do a fast lookup on a field if you tell it to build an
  index for that field ahead of time. Without `by_slug`, looking up a product
  by its URL slug would mean scanning every row. `products.bySlug` does
  exactly this lookup:

  ```ts
  const p = await ctx.db
    .query("products")
    .withIndex("by_slug", (q) => q.eq("slug", slug))
    .unique();
  ```

  `by_active` exists because the storefront's product list always filters to
  `active: true` — indexing that boolean means "give me only the live
  products" is a fast index scan, not a table scan + filter.

```ts
orders: defineTable({
  orderNo: v.string(),               // LX-YYYYMMDD-XXXX
  status: v.union(v.literal("pending"), v.literal("confirmed"), /* ... */),
  customer: v.object({ name, phone, address, area, notes }),
  items: v.array(v.object({ productId, name, price, qty, size, color })),
  subtotal: v.number(),
  deliveryFee: v.number(),
  discount: v.number(),
  promoCode: v.optional(v.string()),
  total: v.number(),
  payment: v.object({ method, bkashNumber, bkashTrxId, verified, paidAt }),
  courier: v.optional(v.object({ name, trackingId })),
  source: v.optional(v.object({ landingSlug, utm, fbclid, fbc, fbp })),
  statusHistory: v.array(v.object({ status, at })),
})
  .index("by_orderNo", ["orderNo"])
  .index("by_status", ["status"])
  .index("by_phone", ["customer.phone"]),
```

Notice what's **denormalized on purpose**: `items` stores `name` and `price`
as a *snapshot*, not just a `productId` reference. If the admin later renames
the product or changes its price, old orders must still show what the
customer actually paid — that's a real invoice, not a live pointer. This is
a deliberate design decision, not an oversight.

`by_status` lets the admin order list filter by status instantly.
`by_phone` powers both order tracking (`orders.track`) and abandoned-checkout
matching — both need "find rows for this phone number" to be fast.

### `orders.place` — the most important function in the codebase

This single **mutation** (`convex/orders.ts`) is where money changes hands.
Let's walk it top to bottom.

**1. Validate input that must never reach the database malformed:**

```ts
if (!isValidBDPhone(args.customer.phone)) throw new Error("Invalid phone number");
if (args.items.length === 0) throw new Error("Cart is empty");
```

**2. Resolve the landing page, if this order came from one** (needed for
price overrides and stats — Chapter 7).

**3. Loop over cart items, check stock, and decrement it — *inside the same
transaction*:**

```ts
for (const it of args.items) {
  const p = await ctx.db.get(it.productId);
  if (!p || !p.active) throw new Error("Product unavailable");
  const vi = p.variants.findIndex(
    (x) => x.size === it.size && (!it.color || x.color === it.color)
  );
  if (vi === -1) throw new Error(`Variant unavailable: ${p.name} ${it.size}`);
  if (p.variants[vi].stock < it.qty) throw new Error(`Out of stock: ${p.name} (${it.size})`);

  const variants = [...p.variants];
  variants[vi] = { ...variants[vi], stock: variants[vi].stock - it.qty };
  await ctx.db.patch(p._id, { variants });

  const unit =
    landing && landing.productId === p._id && landing.priceOverride != null
      ? landing.priceOverride
      : p.price;              // <-- price comes from the DB, never the client
  subtotal += unit * it.qty;
  items.push({ productId: p._id, name: p.name, price: unit, qty: it.qty, size: it.size, color: it.color });
}
```

Notice the client never sends a `price` for its cart items — only
`productId`, `qty`, `size`, `color`. The **server looks up the real price**
every single time. This is the single most important security lesson in the
whole app (Chapter 4 goes deeper).

**4. Apply a promo code, if valid** — checks `active`, expiry, `maxUses`, and
`minOrder`, using `calcDiscount` from `lib/pricing.ts` (a pure function,
Chapter 9 explains why that matters).

**5. Compute delivery fee** from admin-configured settings, using
`calcDeliveryFee` — same pure function used by the checkout page's *preview*
UI, so the number the customer sees before submitting matches exactly what
the server will charge.

**6. Insert the order** with `status: "pending"` and a `statusHistory` of one
entry.

**7. Mark any matching abandoned checkout as converted, then schedule the
Meta Purchase event:**

```ts
await ctx.scheduler.runAfter(0, internal.capi.sendEvent, {
  eventName: "Purchase",
  eventId: args.tracking?.eventId ?? no,
  customer: { name: args.customer.name, phone: args.customer.phone, city: ... },
  customData: { value: total, currency: "BDT", content_ids: items.map(...), ... },
  fbc: args.tracking?.fbc,
  fbp: args.tracking?.fbp,
  attempt: 1,
});
```

### Why is this *one* mutation?

Because a mutation in Convex is **atomic** — every `ctx.db.patch`/`insert`
call inside `place` either *all* commit together or *none* do. If two
customers buy the last unit of a size at the same instant, Convex serializes
their mutations; the second one to run sees the already-decremented stock and
throws `"Out of stock"` before an order is ever created. You get correct
inventory **for free**, without hand-rolled locks or `SELECT ... FOR UPDATE`.

### Why is the CAPI call *scheduled*, not *awaited*?

```ts
await ctx.scheduler.runAfter(0, internal.capi.sendEvent, { ... });
```

`runAfter(0, ...)` doesn't run the action *now* — it queues it to run
immediately *after* this mutation commits, as a completely separate
transaction. If it directly `await`ed a `fetch()` to Meta's API inside the
mutation, two things would break:

1. Mutations can't call `fetch` at all (only actions can reach the network).
2. Even if they could, a slow or down Meta API would make **the customer's
   order placement hang or fail** — the business's core function (take the
   order) would depend on an ad-tracking vendor's uptime. That's backwards.

By scheduling it, the order write always succeeds fast, and the CAPI call
retries independently — see the retry logic in Chapter 8.

💡 **Why this matters**: "should this be one mutation or several separate
calls?" is a real design decision you'll face constantly. The rule of thumb
here: things that must succeed-or-fail *together* (stock check + decrement +
order insert) go in one mutation; things that are allowed to fail
independently and be retried (talking to Meta) get scheduled out.

---

## 4. State on the client

The shopping cart lives in the browser, in a **Zustand** store
(`lib/cart.ts`), persisted to `localStorage` so it survives a refresh:

```ts
export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      drawerOpen: false,
      add: (item, qty = 1) =>
        set((s) => {
          const idx = s.items.findIndex(
            (i) => i.productId === item.productId && i.size === item.size
          );
          if (idx >= 0) {
            const items = [...s.items];
            items[idx] = { ...items[idx], qty: items[idx].qty + qty };
            return { items, drawerOpen: true };
          }
          return { items: [...s.items, { ...item, qty }], drawerOpen: true };
        }),
      // remove, setQty, clear, setDrawer …
    }),
    { name: "luxe_cart_v2" }
  )
);
```

`persist` handles serializing `items`/`drawerOpen` to `localStorage` under
the key `"luxe_cart_v2"` and rehydrating on load — this is the *entire*
"save the cart" feature, no backend call needed while browsing.

Every `CartItem` in this store carries a `price` field, and the UI
(`cartSubtotal`, the cart drawer, the checkout page's running total) uses it
to *preview* the total for the customer as they shop.

### The security lesson: never trust the client's price

Here's the crucial point: that `price` field on the client is **only ever a
preview**. Look again at `orders.place` in Chapter 3 — the mutation's
arguments for each item are just:

```ts
items: v.array(
  v.object({ productId: v.id("products"), qty: v.number(), size: v.string(), color: v.optional(v.string()) })
),
```

**No `price` field at all.** The server refuses to even accept one. Instead,
inside the mutation, it does `const p = await ctx.db.get(it.productId)` and
reads `p.price` (or the landing page's `priceOverride`) directly from the
database. If someone opened devtools and tried to submit `price: 1` for a
৳590 t-shirt, it would be silently ignored — the real ৳590 is what gets
charged, because the server never looked at what the client claimed.

💡 **Why this matters**: this is the single most common real-world
e-commerce vulnerability in beginner projects — "trust the price the
frontend sends." Any value that affects money, permissions, or ownership
must be **recomputed or re-checked on the server**, every time, no
exceptions. The client is a UI, not a source of truth.

---

## 5. Animation with Framer Motion

Three patterns cover almost every animation in this app.

### 1. `whileInView` scroll reveals with stagger

`components/store/Reveal.tsx` is a tiny reusable wrapper used all over the
storefront and landing pages:

```tsx
export default function Reveal({ children, delay = 0, className }: { ... }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.7, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}
```

- `initial` is the starting style (invisible, shifted down 26px).
- `whileInView` is the style to animate *to* the moment the element scrolls
  into the viewport — Framer Motion wires up an `IntersectionObserver`
  internally, you don't write one yourself.
- `viewport={{ once: true, amount: 0.08 }}` means "only trigger once" (don't
  re-animate every time it scrolls in and out) and "once 8% of the element is
  visible."
- `delay` lets a parent stagger children — e.g. the landing page's benefits
  list (`components/landing/LandingPage.tsx`) animates each bullet with
  `delay: i * 0.1`, so they cascade in one after another instead of all at once.

### 2. `AnimatePresence` for the cart drawer and success overlay

Plain React can't animate something *leaving* the DOM — by the time you'd
run an exit animation, the element is already gone. `AnimatePresence` from
Framer Motion solves this by keeping the element mounted just long enough to
finish its `exit` animation.

```tsx
// components/store/CartDrawer.tsx (trimmed)
<AnimatePresence>
  {drawerOpen && (
    <>
      <motion.div /* backdrop */ initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
      <motion.aside
        initial={{ x: "105%" }}
        animate={{ x: 0 }}
        exit={{ x: "105%" }}
        transition={{ type: "tween", duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
      >
        {/* cart contents */}
      </motion.aside>
    </>
  )}
</AnimatePresence>
```

The drawer literally slides off-screen (`x: "105%"`) rather than
disappearing when `setDrawer(false)` is called — `AnimatePresence` notices
`drawerOpen` became `false`, plays the `exit` animation on the still-mounted
element, and only then removes it from the DOM. The checkout page uses the
exact same pattern for its error banner and its `bKash` payment fields
sliding open (`initial={{ height: 0 }}` → `animate={{ height: "auto" }}`).

### 3. Word-by-word hero reveal (staggered children without a wrapper library)

`app/page.tsx`'s hero headline splits text into words and animates each with
an increasing `delay`:

```tsx
function HeroWords({ text, delay = 0 }: { text: string; delay?: number }) {
  const words = text.split(" ");
  return (
    <span>
      {words.map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: delay + i * 0.07 }}
        >
          {w}{i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </span>
  );
}
```

No stagger helper needed — each word just gets `delay + i * 0.07`, so word 5
starts 0.35s after word 0.

💡 **Why this matters**: notice none of this is CSS `@keyframes` or a heavy
animation library — it's declarative React state (`initial`/`animate`/`exit`
props) that Framer Motion diffs and animates for you, the same mental model
as `useState`. Once you know these three patterns you can read *any* Framer
Motion code in this repo.

---

## 6. Payments & the Bangladeshi context

Two payment methods exist in `orders.schema`'s `payment.method`:
`"cod"` (Cash on Delivery) and `"bkash"` (manual bKash "Send Money").

**Why COD dominates**: in the Bangladeshi e-commerce market, most shoppers
don't trust paying online before receiving goods — card penetration is low,
and COD lets them inspect the product at the door before paying the courier.
Any store that *requires* upfront payment loses the majority of its
addressable market. So COD is the default (`method: "cod"` pre-selected in
`app/checkout/page.tsx`), and it's what the whole abandoned-checkout system
(below) is built to rescue.

**Why there are no customer accounts**: `REQUIREMENTS.md` is explicit about
this — "No customer login required to order (guest checkout only — critical
for BD COD conversion)." Every extra field or account-creation step between
"I want this shirt" and "order placed" loses conversions, especially on
mobile Facebook traffic. Admin-side accounts exist (Chapter on Convex Auth,
`convex/auth.ts`); customer accounts do not.

**Manual bKash verification**: bKash is Bangladesh's dominant mobile-money
platform. Outfleek doesn't (yet) integrate bKash's payment gateway API —
instead, the storefront shows the admin's bKash number and instructions
(`settings.bkashNumber`, `settings.bkashInstructions`), the customer sends
money from their own bKash app, then types in *their own* bKash number and
the transaction ID (TrxID) they were given:

```tsx
// app/checkout/page.tsx
payment: {
  method,
  bkashNumber: method === "bkash" ? bkashNumber.trim() : undefined,
  bkashTrxId: method === "bkash" ? bkashTrxId.trim() : undefined,
},
```

The order is inserted with `payment.verified: false`. An admin later checks
their real bKash transaction history and flips it to verified in the admin
order view (`orders.adminUpdate`, `patch.paymentVerified`), which also stamps
`paidAt`. This is intentionally manual — it's cheaper and faster to ship than
integrating a payment gateway, and `REQUIREMENTS.md` flags a real bKash
Payment Gateway integration as a `v2` item, not part of the MVP.

**Delivery-zone fees and free-delivery threshold**: `lib/pricing.ts`'s
`calcDeliveryFee` charges `feeDhaka` (default ৳80) or `feeOutside` (default
৳130) depending on `customer.area`, and waives it entirely once
`subtotal - discount >= freeThreshold` (default ৳2000) — all three numbers
are admin-configurable in `convex/settings.ts`, not hardcoded, because
delivery pricing changes with courier contracts.

**Why abandoned-checkout capture matters for a COD business**: with COD,
"placing an order" and "paying" are two separate moments — a customer who
types their name and phone but closes the tab before hitting submit is
extremely recoverable (call them, confirm, place the order for them). The
checkout page debounces a save to `abandonedCheckouts` the moment a valid
phone number is entered:

```tsx
// app/checkout/page.tsx
useEffect(() => {
  if (!phoneValid || items.length === 0 || success) return;
  const t = setTimeout(() => {
    saveAbandoned({ name: name || undefined, phone, address: address || undefined, items: ..., total }).catch(() => {});
  }, 1200);
  return () => clearTimeout(t);
}, [phoneValid, phone, name, address, total, items]);
```

`orders.place` itself later marks that row `convertedOrderId` if the
customer *does* complete checkout, so the admin's "abandoned" list
(`orders.abandonedList`) only ever shows genuinely unrecovered carts.

💡 **Why this matters**: good software design starts from the market, not
the framework. Every one of these decisions — guest checkout, COD default,
manual bKash, abandoned-cart capture — traces directly back to how
Bangladeshi shoppers actually buy. A generic Shopify-style flow built
without that context would convert worse here.

---

## 7. The landing-page builder

A **landing page** is a standalone, single-product, single-page sales funnel
at `/l/[slug]` — built for running a specific Facebook ad to a specific
audience without sending them to the general store (and its navigation,
which would let them wander off).

### The data-driven pattern

The `landingPages` table doesn't store HTML or hardcoded React components for
each page. It stores a `sections` array of typed content blobs:

```ts
const landingSection = v.object({
  type: v.union(
    v.literal("hero"), v.literal("benefits"), v.literal("gallery"),
    v.literal("reviews"), v.literal("offer"), v.literal("sizeChart"),
    v.literal("faq"), v.literal("orderForm")
  ),
  enabled: v.boolean(),
  content: v.any(),   // flexible per-section blob: headline, bullets, faqs, …
});
```

`components/landing/LandingPage.tsx` then maps each `type` to a matching
React component — `Hero`, `Benefits`, `Gallery`, etc. — reading whatever it
needs out of `content`:

```tsx
function Hero({ content, price }: { content: any; price: number }) {
  return (
    <section>
      <h1>{content?.headline ?? "Timeless Style"}</h1>
      {content?.subheadline && <p>{content.subheadline}</p>}
      <button onClick={scrollToOrder}>
        {content?.ctaText ?? `Order Now — ${tk(price)}`}
      </button>
    </section>
  );
}
```

Building a new landing page is then just: pick a product, add/reorder/toggle
sections in the admin UI, fill in each section's fields, and publish. No new
code, no deploy.

### Why this pattern is powerful

This is called a **data-driven UI**: the *shape* of the page (which sections,
in what order, enabled or not) lives in the database as data, and the
frontend is a generic renderer for that data. The alternative — one React
page per landing page — would mean a code deploy for every new ad campaign,
which is far too slow for someone running dozens of Facebook ad tests a
week. The trade-off is that `content: v.any()` gives up type safety inside
each section's blob — a worthwhile trade here because the section library is
small and admin-only.

### Per-page price overrides and stats

Each `landingPages` row can set `priceOverride`, `compareAtOverride`, and
`deliveryFeeOverride` — so the *same* product can sell at a discount on one
ad campaign's landing page while staying full price in the main store. This
is honored in two places that must agree: the display (`landingPages.bySlug`
returns `price: lp.priceOverride ?? product.price`) and, critically, in
`orders.place` itself (Chapter 3), which re-checks `landing.priceOverride`
server-side — the landing page can't be used to trick the server into a
lower price than the admin actually configured, because the server looks the
override up itself from the database, not from anything the client sends.

Stats (`views`, `initiates`, `ordersCount`) are incremented by dedicated
mutations (`recordView`, `recordInitiate`) fired from the page, and by
`orders.place` incrementing `ordersCount` when an order attributes to that
landing page. The admin dashboard turns these into a conversion rate:

```ts
cvr: l.views ? Math.round((l.ordersCount / l.views) * 1000) / 10 : 0,
```

💡 **Why this matters**: "should this be a config-driven system or a
one-off page?" is a question you'll ask constantly as a developer. The
signal to look for: if a non-developer will need to create many similar
variations of something *frequently*, model it as data and build one
renderer — don't write bespoke code for each instance.

---

## 8. Meta Pixel + Conversions API

This is the most commercially valuable chapter — understanding this well is
a real, marketable skill (Meta ad accounts live or die on tracking quality).

### What a pixel is, and why browser-only tracking loses data

The **Meta Pixel** is a JavaScript snippet (`lib/tracking.ts`'s `initPixel`)
that runs in the customer's browser and calls `fbq('track', 'Purchase', ...)`
whenever something trackable happens. Meta uses these events to attribute ad
clicks to sales and to optimize *who* your ads are shown to next.

The problem: browser-only tracking silently loses events. Ad blockers block
the pixel script outright. iOS's App Tracking Transparency and Safari's
Intelligent Tracking Prevention block or truncate third-party cookies and
scripts. Every lost event makes Meta's optimization worse — it thinks fewer
people bought than actually did.

### What CAPI is

The **Conversions API (CAPI)** is the server-side twin: instead of the
browser calling Meta, *your own backend* calls Meta's Graph API directly
(`convex/capi.ts`'s `sendEvent`, a Convex **action** since it needs `fetch`
and Node's `crypto`). A server call can't be blocked by an ad blocker — it
never touches the customer's browser at all.

### The key concept: one `event_id`, sent to both sides

If you fire `Purchase` from both the browser pixel *and* the server, and
Meta can't tell they're the same real-world event, it counts the sale
**twice**. The fix is **deduplication**: both the browser call and the
server call carry the exact same `event_id`, and Meta discards the second
copy it receives.

```ts
// lib/tracking.ts
export function firePixel(event: StdEvent, customData?: Record<string, unknown>) {
  const eventId = uuid();
  if (window.fbq) window.fbq("track", event, customData ?? {}, { eventID: eventId });
  return { eventId, ...getTrackingContext(), customData };
}
```

```tsx
// app/checkout/page.tsx — Purchase specifically is generated up front...
const eventId = uuid();
const res = await placeOrder({ ..., tracking: { eventId, ...getTrackingContext() } });
// ...and the SAME id is used for the browser pixel fire, after the order succeeds:
window.fbq?.("track", "Purchase", { value: res.total, currency: "BDT" }, { eventID: eventId });
```

The server side receives that same `eventId` as `args.tracking.eventId` in
`orders.place` and passes it straight through to the scheduled CAPI call:

```ts
await ctx.scheduler.runAfter(0, internal.capi.sendEvent, {
  eventName: "Purchase",
  eventId: args.tracking?.eventId ?? no,   // falls back to order number if no client id
  ...
});
```

For all the *other* standard events (`PageView`, `ViewContent`, `AddToCart`,
`InitiateCheckout`, `AddPaymentInfo`), the pattern is: fire the pixel client
side, then immediately call `capiHelpers.mirrorEvent` — a public mutation
that just schedules the same `capi.sendEvent` action with the same
`eventId`:

```ts
// convex/capiHelpers.ts
export const mirrorEvent = mutation({
  args: { eventName: v.union(...), eventId: v.string(), customData: v.optional(v.any()), ... },
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(0, internal.capi.sendEvent, { ...args, attempt: 1 });
  },
});
```

### PII hashing on the server

Meta requires personal data (name, phone, city) to be **SHA-256 hashed
before it leaves your server** — never send raw PII, and never hash it in
the browser (a browser-computed hash is just as sensitive as the raw value,
since it's still directly matchable). `capi.ts` does this in the action,
right before the request goes out:

```ts
function sha256(s: string) { return createHash("sha256").update(s).digest("hex"); }

if (args.customer?.phone) {
  const ph = sha256(normalizeBDPhone(args.customer.phone));
  user_data.ph = [ph];
  user_data.external_id = [ph];   // stable customer key — useful with no email/accounts
}
if (args.customer?.name) {
  const parts = args.customer.name.trim().toLowerCase().split(/\s+/);
  user_data.fn = [sha256(parts[0])];
  if (parts.length > 1) user_data.ln = [sha256(parts[parts.length - 1])];
}
```

`normalizeBDPhone` (from `lib/validation.ts`) converts any of `01XXXXXXXXX`,
`1XXXXXXXXX`, or `+8801XXXXXXXXX` into the single canonical
`8801XXXXXXXXX` form *before* hashing — hashing must be applied to a
consistent format, or the same phone number would hash to different values
depending on how it was typed, breaking Meta's matching.

### `fbclid` → `_fbc` capture

When a visitor clicks a Facebook ad, the URL Meta sends them to carries a
`?fbclid=...` query parameter. Capturing it is, per the project's own
`REQUIREMENTS.md`, **"the biggest EMQ lever for a COD store"** (EMQ = Event
Match Quality, Meta's own score for how well it can match your server events
to a real person/ad click) — because this market has no email-based
matching to fall back on.

```ts
// lib/tracking.ts
export function captureClickIds() {
  const params = new URLSearchParams(window.location.search);
  const fbclid = params.get("fbclid");
  if (fbclid && !readCookie("_fbc")) {
    const fbc = `fb.1.${Date.now()}.${fbclid}`;
    document.cookie = `_fbc=${encodeURIComponent(fbc)}; path=/; max-age=${90 * 86400}; SameSite=Lax`;
  }
  ...
}
```

This runs once on mount in `<Tracking>` (`app/providers.tsx`), so it's
captured the instant someone lands from an ad, before they've even seen a
product. The resulting `_fbc` cookie, plus Meta's own `_fbp` cookie, get read
back out by `getTrackingContext()` and threaded through every event —
including all the way into `orders.source.fbc`/`fbp` on the order row itself,
so attribution survives even if the order is placed minutes or hours later.

### Why Purchase is fired server-side

`orders.place` schedules the CAPI `Purchase` event as part of the same
mutation that creates the order (Chapter 3) — this makes the **server the
source of truth** for whether a sale happened. The browser pixel fire is
just a *duplicate copy for redundancy/dedup*, fired only after
`placeOrder()` already succeeded. If the customer's browser crashed, lost
connection, or closed the tab the instant after the order was created, the
sale is still recorded with Meta — because it doesn't depend on JavaScript
still running in a tab that may already be gone.

### Retries

`capi.sendEvent` retries up to 3 times with increasing backoff if the Graph
API call fails, and always logs the outcome to `capiLogs` (visible on the
admin's Tracking Debug page):

```ts
if (args.attempt < 3) {
  await ctx.scheduler.runAfter(60_000 * args.attempt, internal.capi.sendEvent, { ...args, attempt: args.attempt + 1 });
}
```

💡 **Why this matters**: "one shared ID across two independent systems, so a
downstream consumer can deduplicate" is a general distributed-systems
pattern, not just a Meta quirk — you'll meet it again in message queues,
webhooks, and payment processors ("idempotency keys" are the same idea).

---

## 9. Testing

### What unit testing is

A **unit test** calls one small piece of code directly (no browser, no
server, no database) with a specific input and asserts the output is exactly
what you expect. Outfleek's suite lives in `tests/unit/*.test.ts` and runs
with **Vitest** (`npm test`).

### Why pure functions in `lib/` are easy to test — and components aren't

A **pure function** always returns the same output for the same input and
has no side effects (no DB call, no `fetch`, no reading `Date.now()` unless
you pass it in). `lib/pricing.ts` and `lib/validation.ts` are both pure —
they don't import React, Convex, or anything browser-specific. That's *why*
they're the ones with a full test suite; they're trivial to test:

```ts
expect(calcDiscount(999, { kind: "percent", value: 10 })).toBe(100);
```

No setup, no mocking, no rendering — call the function, check the number.

A React component like `app/checkout/page.tsx`, by contrast, has `useState`,
`useEffect`, live Convex queries, and DOM events — testing it properly needs
a rendering environment, mocked network/DB responses, and simulated user
interaction. That's `README.md`'s Playwright screenshot suite, a different
(heavier) kind of test than a unit test.

### Design for testability: this is the lesson

`orders.place` (a Convex mutation, hard to unit test in isolation) doesn't
compute discounts or delivery fees itself — it *imports* `calcDiscount` and
`calcDeliveryFee` from `lib/pricing.ts` and calls them:

```ts
// convex/orders.ts
import { calcDiscount, calcDeliveryFee } from "../lib/pricing";
...
discount = calcDiscount(subtotal, { kind: code.kind, value: code.value });
...
const deliveryFee = calcDeliveryFee({ subtotal, discount, area: args.customer.area, feeDhaka, feeOutside, freeThreshold: threshold, override: landing?.deliveryFeeOverride });
```

The exact same functions are imported by `app/checkout/page.tsx`'s live
total preview. This is a deliberate **extraction**: pulling money math out
of both the backend mutation and the frontend component into one
dependency-free module means (a) the two can never silently disagree, and
(b) that money math is 100% unit-testable without spinning up Convex or
React at all. If the logic had stayed inline inside the mutation, testing it
would require running the whole Convex test harness for every single
boundary case — extraction is what makes 100% coverage on `lib/pricing.ts`
realistic.

### Black box vs. white box testing

- **Black box**: you test based only on the function's documented
  *behavior* (inputs → expected outputs), without looking at how it's
  implemented internally. "Given a subtotal of 999 and a 10% promo, I expect
  a discount of 100" is a black-box test — you don't need to have read
  `calcDiscount`'s source to write it.
- **White box**: you look at the actual code paths (`if`/`else` branches,
  loops) and deliberately write tests that exercise each one, so you know
  every line and every decision has been checked.

### Statement and branch coverage

- **Statement coverage** = the percentage of lines of code that ran at least
  once across your whole test suite.
- **Branch coverage** = the percentage of `if`/`else` (and similar) branches
  that were each taken at least once in *both* directions.

`vitest.config.ts` runs coverage with the v8 provider over `lib/**/*.ts`
(excluding `lib/tracking.ts`, which is browser-only and covered by manual/E2E
testing instead). Per `README.md`, the project reports **98.63% statement
coverage**, with `lib/pricing.ts` and `lib/validation.ts` at **100%**.

### Boundary value analysis

**Boundary value analysis** means testing values right at, just below, and
just above a threshold — because off-by-one bugs live exactly there. The
free-delivery threshold (default ৳2000) is tested at all three points:

```ts
// tests/unit/pricing.test.ts
it("is free at exactly the threshold (boundary: 2000)", () => {
  expect(calcDeliveryFee({ ...base, subtotal: 2000, discount: 0, area: "dhaka" })).toBe(0);
});

it("charges a fee just below the threshold (boundary: 1999)", () => {
  expect(calcDeliveryFee({ ...base, subtotal: 1999, discount: 0, area: "dhaka" })).toBe(80);
});

it("is free just above the threshold (boundary: 2001)", () => {
  expect(calcDeliveryFee({ ...base, subtotal: 2001, discount: 0, area: "outside" })).toBe(0);
});
```

This proves the comparison in `calcDeliveryFee` (`subtotal - discount >=
freeThreshold`) uses `>=`, not `>` — a one-character bug that would have
charged delivery fees to a customer sitting exactly at the threshold, and
these three tests are what would catch it if someone "simplified" the
operator later.

Two more real examples worth reading closely:

```ts
// tests/unit/validation.test.ts
it.each(["013", "014", "015", "016", "017", "018", "019"])(
  "accepts valid prefix %s",
  (prefix) => { expect(isValidBDPhone(`${prefix}12345678`)).toBe(true); }
);
it.each(["011", "012"])("rejects invalid prefix %s", (prefix) => {
  expect(isValidBDPhone(`${prefix}12345678`)).toBe(false);
});
```

This is boundary value analysis on the *set* of valid prefixes — `013`
through `019` are valid Bangladeshi mobile prefixes, `011`/`012` are the
adjacent invalid ones, deliberately chosen because they're the values a
regex mistake is most likely to get wrong.

```ts
it("caps a fixed discount at the subtotal (never negative total)", () => {
  expect(calcDiscount(100, { kind: "fixed", value: 500 })).toBe(100);
});
```

This is a business-rule test, not just a boundary test: it proves a ৳500
fixed-amount coupon can never make a ৳100 order's total negative — the
function clamps to `Math.min(raw, subtotal)`.

### Regression

A **regression** is a bug that reintroduces a problem that was already fixed
once. The whole point of committing a growing test suite (rather than
testing manually and moving on) is that every one of these tests re-runs on
every future change — if someone edits `calcDeliveryFee` next year and
breaks the `>=` boundary, `npm test` fails immediately instead of shipping a
silent billing bug to production.

💡 **Why this matters**: "which parts of my code are cheap to test, and how
do I design more of my code to be like that" is a skill that pays off for
your entire career — it's the difference between a codebase you can change
confidently and one everyone is afraid to touch.

---

## 10. Deployment

**Convex dev vs. prod deployments**: `npx convex dev` connects your local
machine to a personal **dev deployment** — a real cloud database, but scoped
to you, meant for iterating. When you're ready to ship, `npx convex deploy`
pushes your `convex/*.ts` functions to a separate **production deployment**
with its own URL and its own environment variables (so `ADMIN_PASSWORD`,
the Meta CAPI token, etc. are set independently per environment — a dev
mistake can never leak into or break prod).

**Vercel** hosts the Next.js frontend. It needs to know the URL of the
Convex deployment it should talk to — that's the `NEXT_PUBLIC_CONVEX_URL`
environment variable, set in Vercel's project settings for production
(pointing at the *production* Convex deployment, not your personal dev one).

**Environment variables** worth knowing where they live:

| Variable | Where it's set | Why |
|---|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | `.env.local` (dev, auto-written by `convex dev`) / Vercel project settings (prod) | The frontend needs this to open the Convex connection (`app/providers.tsx`) |
| `ADMIN_PASSWORD` | `npx convex env set` (per deployment) | Read server-side only, in `convex/auth.ts` — never shipped to the browser |
| `pixelId`, `capiToken`, `testEventCode` | Convex `settings` table, edited from `/admin/settings` | Runtime-configurable without a redeploy; `capiToken` is explicitly stripped out of `publicSettings` (Chapter 8) before it ever reaches the client |

### A real deploy bug from this project: an invisible byte in an env var

This actually happened while deploying Outfleek, and it is worth studying
because the symptom points nowhere near the cause.

The production Convex URL was added to Vercel from a PowerShell pipeline:

```powershell
"https://reliable-opossum-818.convex.cloud" | npx vercel env add NEXT_PUBLIC_CONVEX_URL production
```

The deploy succeeded. The build succeeded. Then every page on the live site
died instantly with a blank screen and this console error:

```
Uncaught Error: Invalid deployment address: Must start with "https://" or "http://".
Found "﻿https://reliable-opossum-818.convex.cloud".
```

Look closely at the value in the error: it *does* start with `https://`. The
error looks like a lie. But immediately before the `h` there is `﻿` — a
**UTF-8 byte order mark (BOM)**, an invisible character that PowerShell
prepended when it piped the string. Convex's URL validation compares the
first characters strictly, the BOM is not `h`, so the check fails.

The value looked correct in the Vercel dashboard, in the terminal, and in an
editor — because a BOM renders as nothing at all.

The fix was to delete the variable and re-add it from a shell that does not
add a BOM:

```bash
vercel env rm NEXT_PUBLIC_CONVEX_URL production --yes
printf 'https://reliable-opossum-818.convex.cloud' | vercel env add NEXT_PUBLIC_CONVEX_URL production
```

then redeploy. (`printf` in bash emits exactly the bytes you give it; the
PowerShell pipeline did not.)

💡 **Why this matters**: the lesson is not "PowerShell is bad" — it is that
when an error message describes something that looks impossible, suspect the
bytes you cannot see. Trailing whitespace, invisible Unicode, and wrong line
endings all produce this same "but it looks right!" class of bug on every
platform. Build the instinct early: when a value fails a strict parser,
inspect its raw bytes rather than its rendering.

---

## 11. Exercises

Work through these roughly in order. Each names the files you'll touch.

1. ⭐ **Change the free-delivery threshold.** Update the default in
   `convex/lib.ts`'s `DEFAULT_SETTINGS.freeDeliveryThreshold`, then verify it
   also updates instantly in `/admin/settings` (no code change needed there —
   why not?).
   *Hint: trace where `DEFAULT_SETTINGS` is spread into `publicSettings`.*

2. ⭐ **Add a "Best Seller" badge.** Products already support a `badges:
   string[]` field (`convex/schema.ts`, `convex/products.ts`). Add
   `"Best Seller"` as an option in the admin product form and render it with
   its own color on the storefront.
   *Files: `app/admin/products/page.tsx`, `app/page.tsx` (or wherever badges render).*

3. ⭐⭐ **Add a product field (e.g. `material: string`) and surface it.** Add
   it to `productFields` in `convex/products.ts` and `schema.ts`'s `products`
   table, then show it in the admin product form and on the product detail
   page.
   *Hint: Convex schema changes take effect the moment `convex dev` picks up the file — watch the terminal for validation errors on existing rows.*

4. ⭐⭐ **Write a unit test for a new pricing rule** — e.g. "a promo code
   discount can never exceed 50% even if configured higher." Implement the
   cap in `calcDiscount` (`lib/pricing.ts`) and add boundary tests (49%, 50%,
   51%) in `tests/unit/pricing.test.ts`, following the existing style.

5. ⭐⭐⭐ **Add a new landing-page section type**, e.g. `"video"`. Add the
   literal to the `landingSection` union in `convex/schema.ts` *and*
   `convex/landingPages.ts`'s `pageFields`, then add a matching component in
   `components/landing/LandingPage.tsx` and wire it into the admin
   landing-page editor's section list.

6. ⭐⭐⭐ **Add a new order status**, e.g. `"awaiting_stock"`. Update the
   `status` union in `convex/schema.ts`, the admin status-change UI, and
   consider: should this status trigger a CAPI event like `"confirmed"`
   does? Should it restock/de-stock like `"cancelled"`/`"returned"` does?
   *This exercise is really about reading `orders.updateStatus` closely enough to reason about side effects.*

7. ⭐⭐⭐ **Implement product search.** Add a `search` argument to
   `products.list`, matching on `name`/`description` (client-side `.filter`
   is fine for this catalog size; note there's no search index yet — when
   *would* you need one?), and wire up a search box in `app/page.tsx`.

8. ⭐⭐⭐⭐ **Add a second promo-code type**: "buy one get one on the cheapest
   item." This doesn't fit `calcDiscount`'s current `{ kind, value }` shape —
   design the new `Promo` variant in `lib/pricing.ts`, update
   `orders.place`'s promo-application block to pass cart line items (not just
   subtotal) into the calculation, and write a full test suite for it
   including the empty-cart and single-item edge cases.

9. ⭐⭐⭐⭐ **Add a low-stock admin alert.** When any variant's stock drops
   below a configurable threshold after `orders.place` decrements it,
   surface it on the admin dashboard (`orders.dashboard`) — think about
   whether this belongs in the mutation itself or as a separate query the
   dashboard runs.

10. ⭐⭐⭐⭐ **Add rate limiting to `orders.place`** to guard against the
    fake-order spam `REQUIREMENTS.md` explicitly calls out as common for
    Bangladeshi COD stores. You'll need to decide what to key it on (phone?
    IP — note Convex mutations don't easily see the caller's IP) and where
    the counter state should live (a new table, indexed by that key).

---

## 12. Glossary

| Term | Plain-language definition |
|---|---|
| **Mutation** | A Convex function that writes to the database. Runs atomically (all-or-nothing) as one transaction. |
| **Query** | A Convex function that only reads the database. Automatically re-runs on the client (`useQuery`) whenever the data it read changes — "reactive." |
| **Action** | A Convex function allowed to call the outside world (`fetch`, npm packages) but that must go through a query/mutation to touch the database itself. |
| **Scheduler** | Convex's built-in mechanism to queue a mutation/action to run later (even "0ms later"), outside the current transaction — replaces a job queue. |
| **Index** | A precomputed lookup structure on one or more fields, so the database can find matching rows fast instead of scanning every row. |
| **Hydration** | The process of React "waking up" server-sent or cached HTML by attaching event listeners and state in the browser, making it interactive. |
| **SSR / CSR** | Server-Side Rendering (HTML generated on the server per request) vs. Client-Side Rendering (the browser builds the page with JavaScript after load). |
| **Reactive query** | A read that automatically updates its result — and re-renders the component using it — whenever the underlying data changes, with no manual refetch/polling code. |
| **Deduplication** (in tracking) | Recognizing that two tracking events (e.g. one from the browser, one from the server) represent the *same* real-world event, using a shared ID, and counting it only once. |
| **EMQ (Event Match Quality)** | Meta's score for how confidently it can match a server-sent event to a real ad-click/person; improved by sending more (and better-hashed) matching signals like phone, `fbc`, `fbp`. |
| **COD (Cash on Delivery)** | A payment method where the customer pays the courier in cash when the order physically arrives, rather than paying online in advance. |
| **Slug** | A URL-safe, human-readable identifier (lowercase, hyphenated) used in a route, e.g. `essential-black-tee` in `/product/essential-black-tee`. |
| **Variant** | A specific purchasable configuration of a product — here, a `{ size, color }` pair, each with its own stock count. |
| **SKU** | Stock Keeping Unit — a unique identifier for one specific sellable variant. This project doesn't use explicit SKU strings; the `(productId, size, color)` combination serves that role. |
| **Coverage** (test coverage) | The percentage of your code (statements, branches, etc.) that your test suite actually executes at least once. High coverage doesn't guarantee correctness, but low coverage guarantees blind spots. |
| **Boundary value analysis** | A test-design technique: deliberately testing values right at, just below, and just above a threshold, since off-by-one and comparison-operator bugs cluster there. |
| **Regression** | A previously-fixed bug reappearing after a later code change — the reason automated tests are re-run continuously, not just once after the original fix. |
