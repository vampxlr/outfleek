# Graph Report - .  (2026-08-19)

## Corpus Check
- Large corpus: 86 files · ~1,294,652 words. Semantic extraction will be expensive (many Claude tokens). Consider running on a subfolder.

## Summary
- 396 nodes · 666 edges · 30 communities (24 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.78)
- Token cost: 70,000 input · 8,500 output

## Community Hubs (Navigation)
- Admin Panel Pages
- Storefront Pages
- Checkout & Landing Runtime
- Package Dependencies
- App TypeScript Config
- Convex TypeScript Config
- Minimal Luxe Design System
- Order Backend Functions
- Payment & Checkout Requirements
- Landing Page Backend
- Admin Panel Requirements
- Product Backend Functions
- Production Bootstrap Script
- CAPI Helpers & Settings Lib
- Convex Architecture Requirements
- Brand Setup Script
- Settings Backend
- Product Import Script
- Category Backend
- Promo Code Backend
- Design Prototype Options
- Pixel & CAPI Tracking Rules
- Admin Authentication
- CAPI Event Sender
- Product Page Design
- Convex Schema
- Database Seed
- Next.js Config
- PostCSS Config
- Mobile First UX

## God Nodes (most connected - your core abstractions)
1. `useAdminToken()` - 25 edges
2. `compilerOptions` - 16 edges
3. `compilerOptions` - 13 edges
4. `useCart` - 13 edges
5. `firePixel()` - 13 edges
6. `fmtBDT()` - 12 edges
7. `T-Shirt E-Commerce Platform` - 12 edges
8. `AdminShell()` - 11 edges
9. `PageHead()` - 11 edges
10. `Card()` - 11 edges

## Surprising Connections (you probably didn't know these)
- `Checkout Prototype Page` --references--> `Meta Pixel + CAPI Tracking Architecture`  [INFERRED]
  designs/checkout.html → REQUIREMENTS.md
- `Categories()` --calls--> `useAdminToken()`  [EXTRACTED]
  app/admin/categories/page.tsx → components/admin/useAdminToken.ts
- `LandingList()` --calls--> `useAdminToken()`  [EXTRACTED]
  app/admin/landing/page.tsx → components/admin/useAdminToken.ts
- `PromoForm()` --calls--> `useAdminToken()`  [EXTRACTED]
  app/admin/promos/page.tsx → components/admin/useAdminToken.ts
- `Settings()` --calls--> `useAdminToken()`  [EXTRACTED]
  app/admin/settings/page.tsx → components/admin/useAdminToken.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Storefront Prototype Pages Forming the Customer Funnel** — designs_option_1_minimal_luxe, designs_product, designs_cart, designs_checkout [EXTRACTED 0.90]
- **Five Alternative Design Options Presented for Selection** — designs_option_1_minimal_luxe, designs_option_2_dark_street, designs_option_3_soft_pastel, designs_option_4_bold_editorial, designs_option_5_glass_gradient [EXTRACTED 0.90]
- **Meta CAPI Tracking Non-Negotiable Invariants** — requirements_event_id_dedup, requirements_pii_hashing, requirements_fbclid_capture, requirements_external_id [EXTRACTED 0.90]

## Communities (30 total, 6 thin omitted)

### Community 0 - "Admin Panel Pages"
Cohesion: 0.08
Nodes (47): Abandoned(), itemsSummary(), Categories(), CategoryForm(), slugify(), Builder(), defaultSections(), Section (+39 more)

### Community 1 - "Storefront Pages"
Cohesion: 0.13
Nodes (24): CartPage(), tk(), HomePage(), Sort, tk(), ProductDetailClient(), SIZE_ORDER, Tab (+16 more)

### Community 2 - "Checkout & Landing Runtime"
Cohesion: 0.09
Nodes (22): CheckoutPage(), Method, tk(), metadata, Providers(), Tracking(), Hero(), LandingPage() (+14 more)

### Community 3 - "Package Dependencies"
Cohesion: 0.06
Nodes (35): convex, framer-motion, next, dependencies, convex, framer-motion, next, react (+27 more)

### Community 4 - "App TypeScript Config"
Cohesion: 0.07
Nodes (26): dom.iterable, esnext, next-env.d.ts, .next/types/**/*.ts, node_modules, **/*.ts, **/*.tsx, compilerOptions (+18 more)

### Community 5 - "Convex TypeScript Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, allowSyntheticDefaultImports, forceConsistentCasingInFileNames, isolatedModules, jsx, lib, module (+11 more)

### Community 6 - "Minimal Luxe Design System"
Cohesion: 0.18
Nodes (15): Cart Prototype Page, Cart Drawer UI Pattern, Free-Delivery Progress Bar UI (shipbar), Minimal Luxe Design System (cream/ink/gold, Georgia serif, hairline borders), Option 1: Minimal Luxe (ATELIER DHAKA), Delivery Fee & Free-Delivery Threshold Rules, Framer Motion, Next.js 15 (App Router) + TypeScript (+7 more)

### Community 7 - "Order Backend Functions"
Cohesion: 0.17
Nodes (10): abandonedList, adminGet, adminList, adminUpdate, dashboard, markContacted, place, saveAbandoned (+2 more)

### Community 8 - "Payment & Checkout Requirements"
Cohesion: 0.21
Nodes (12): Checkout Prototype Page, Checkout bKash Payment Panel (bknum/bktrx fields), Checkout Success / Order Confirmation Panel, Admin Settings (runtime-configurable), Courier Fields + v2 API Adapter (Pathao/Steadfast/RedX), Printable Packing Slip / Invoice, Order Lifecycle (Pending->Confirmed->Packed->Shipped->Delivered, Cancelled, Returned), Checkout Page /checkout (+4 more)

### Community 9 - "Landing Page Backend"
Cohesion: 0.18
Nodes (10): adminGet, adminList, bySlug, create, duplicate, pageFields, recordInitiate, recordView (+2 more)

### Community 10 - "Admin Panel Requirements"
Cohesion: 0.18
Nodes (11): Filter Pills + Sort Toolbar, Abandoned/Incomplete Order Capture, Admin Catalog CRUD (Products, Categories), Admin Dashboard, Admin Landing Pages CRUD, Admin Marketing (Promo Codes, Announcement Bar), Admin Orders Management, Admin Panel /admin (+3 more)

### Community 11 - "Product Backend Functions"
Cohesion: 0.20
Nodes (8): adminList, bySlug, create, generateUploadUrl, list, productFields, remove, update

### Community 12 - "Production Bootstrap Script"
Cohesion: 0.25
Nodes (6): IMAGES, PRODUCT_IMAGE_UUIDS, PRODUCTS, run, sizes, write

### Community 13 - "CAPI Helpers & Settings Lib"
Cohesion: 0.32
Nodes (6): log, mirrorEvent, readToken, recentLogs, getSetting(), requireAdmin()

### Community 14 - "Convex Architecture Requirements"
Cohesion: 0.25
Nodes (8): Tracked Events (PageView, ViewContent, AddToCart, InitiateCheckout, AddPaymentInfo, Purchase, PhoneConfirmed), capiLogs Table, Convex (DB/Backend), Convex Auth (admin only), Convex Data Model (products, categories, orders, abandonedCheckouts, landingPages, promoCodes, settings), Guest Checkout (no login required), Purchase Flow Single Mutation (stock decrement + order insert + scheduled CAPI action), Tracking Debug Admin Tooling

### Community 15 - "Brand Setup Script"
Cohesion: 0.25
Nodes (7): bytes, client, env, noir, p0r, root, sample

### Community 16 - "Settings Backend"
Cohesion: 0.29
Nodes (6): DEFAULT_SETTINGS, adminSettings, getSecretSetting, publicSettings, SECRET_KEYS, updateSettings

### Community 17 - "Product Import Script"
Cohesion: 0.29
Nodes (5): client, env, PRODUCTS, root, sizes

### Community 18 - "Category Backend"
Cohesion: 0.40
Nodes (4): adminList, list, remove, save

### Community 19 - "Promo Code Backend"
Cohesion: 0.40
Nodes (4): adminList, remove, save, validate

### Community 20 - "Design Prototype Options"
Cohesion: 0.40
Nodes (5): Design Options Picker Page, Option 2: Dark Streetwear (DHK DROP), Option 3: Soft Pastel (TulTuli), Option 4: Bold Editorial (KAPOR), Option 5: Glass & Gradient (PRISM)

### Community 21 - "Pixel & CAPI Tracking Rules"
Cohesion: 0.50
Nodes (5): event_id Dedup Invariant (Pixel+CAPI), external_id = Hashed Phone, fbclid/fbc/fbp Capture for EMQ, Meta Pixel + CAPI Tracking Architecture, PII Hashing Server-Side (SHA-256)

### Community 22 - "Admin Authentication"
Cohesion: 0.50
Nodes (3): check, login, logout

### Community 24 - "Product Page Design"
Cohesion: 0.67
Nodes (4): Product Detail Prototype Page, Product Gallery + Size/Color Variant Selector, Product Detail Page /product/[slug], Product Variants (size x color, per-variant stock)

## Knowledge Gaps
- **165 isolated node(s):** `SectionType`, `Section`, `SECTION_LABELS`, `STATUSES`, `TABS` (+160 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `T-Shirt E-Commerce Platform` connect `Minimal Luxe Design System` to `Payment & Checkout Requirements`, `Product Page Design`, `Admin Panel Requirements`, `Convex Architecture Requirements`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `firePixel()` connect `Checkout & Landing Runtime` to `Storefront Pages`?**
  _High betweenness centrality (0.009) - this node is a cross-community bridge._
- **What connects `SectionType`, `Section`, `SECTION_LABELS` to the rest of the system?**
  _165 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Admin Panel Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.0825508607198748 - nodes in this community are weakly interconnected._
- **Should `Storefront Pages` be split into smaller, more focused modules?**
  _Cohesion score 0.12926829268292683 - nodes in this community are weakly interconnected._
- **Should `Checkout & Landing Runtime` be split into smaller, more focused modules?**
  _Cohesion score 0.09024390243902439 - nodes in this community are weakly interconnected._
- **Should `Package Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.05555555555555555 - nodes in this community are weakly interconnected._