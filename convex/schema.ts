import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const variant = v.object({
  size: v.string(), // S M L XL XXL
  color: v.string(),
  stock: v.number(),
});

const landingSection = v.object({
  type: v.union(
    v.literal("hero"),
    v.literal("benefits"),
    v.literal("gallery"),
    v.literal("reviews"),
    v.literal("offer"),
    v.literal("sizeChart"),
    v.literal("faq"),
    v.literal("orderForm")
  ),
  enabled: v.boolean(),
  // Flexible per-section content blob (headline, bullets, imageIds, faqs, etc.)
  content: v.any(),
});

export default defineSchema({
  categories: defineTable({
    name: v.string(),
    slug: v.string(),
    order: v.number(),
    active: v.boolean(),
  }).index("by_slug", ["slug"]),

  products: defineTable({
    name: v.string(),
    slug: v.string(),
    description: v.string(),
    categoryId: v.optional(v.id("categories")),
    price: v.number(), // BDT
    compareAtPrice: v.optional(v.number()),
    cost: v.optional(v.number()),
    imageIds: v.array(v.id("_storage")),
    // External image links (any https URL — free hosting like ImgBB/Cloudinary).
    imageUrls: v.optional(v.array(v.string())),
    variants: v.array(variant),
    badges: v.array(v.string()), // "New" | "Hot" | "Sale"
    active: v.boolean(),
    // fallback visual for products without uploaded images (design placeholder)
    placeholderHue: v.optional(v.number()),
  })
    .index("by_slug", ["slug"])
    .index("by_active", ["active"]),

  orders: defineTable({
    orderNo: v.string(), // LX-YYYYMMDD-XXXX
    status: v.union(
      v.literal("pending"),
      v.literal("confirmed"),
      v.literal("packed"),
      v.literal("shipped"),
      v.literal("delivered"),
      v.literal("cancelled"),
      v.literal("returned")
    ),
    customer: v.object({
      name: v.string(),
      phone: v.string(),
      address: v.string(),
      area: v.union(v.literal("dhaka"), v.literal("outside")),
      notes: v.optional(v.string()),
    }),
    items: v.array(
      v.object({
        productId: v.id("products"),
        name: v.string(),
        price: v.number(),
        qty: v.number(),
        size: v.string(),
        color: v.optional(v.string()),
      })
    ),
    subtotal: v.number(),
    deliveryFee: v.number(),
    discount: v.number(),
    promoCode: v.optional(v.string()),
    total: v.number(),
    payment: v.object({
      method: v.union(v.literal("cod"), v.literal("bkash")),
      bkashNumber: v.optional(v.string()),
      bkashTrxId: v.optional(v.string()),
      verified: v.boolean(),
      paidAt: v.optional(v.number()),
    }),
    courier: v.optional(v.object({ name: v.string(), trackingId: v.string() })),
    internalNotes: v.optional(v.string()),
    returnReason: v.optional(v.string()),
    // attribution
    source: v.optional(
      v.object({
        landingSlug: v.optional(v.string()),
        utm: v.optional(v.any()),
        fbclid: v.optional(v.string()),
        fbc: v.optional(v.string()),
        fbp: v.optional(v.string()),
      })
    ),
    statusHistory: v.array(v.object({ status: v.string(), at: v.number() })),
  })
    .index("by_orderNo", ["orderNo"])
    .index("by_status", ["status"])
    .index("by_phone", ["customer.phone"]),

  abandonedCheckouts: defineTable({
    name: v.optional(v.string()),
    phone: v.string(),
    address: v.optional(v.string()),
    items: v.any(),
    total: v.number(),
    landingSlug: v.optional(v.string()),
    contacted: v.boolean(),
    convertedOrderId: v.optional(v.id("orders")),
  }).index("by_phone", ["phone"]),

  landingPages: defineTable({
    slug: v.string(),
    title: v.string(),
    productId: v.id("products"),
    status: v.union(v.literal("draft"), v.literal("published")),
    sections: v.array(landingSection),
    priceOverride: v.optional(v.number()),
    compareAtOverride: v.optional(v.number()),
    deliveryFeeOverride: v.optional(v.number()),
    og: v.optional(
      v.object({
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        imageId: v.optional(v.id("_storage")),
      })
    ),
    views: v.number(),
    initiates: v.number(),
    ordersCount: v.number(),
  }).index("by_slug", ["slug"]),

  promoCodes: defineTable({
    code: v.string(),
    kind: v.union(v.literal("percent"), v.literal("fixed")),
    value: v.number(),
    minOrder: v.optional(v.number()),
    maxUses: v.optional(v.number()),
    uses: v.number(),
    expiresAt: v.optional(v.number()),
    active: v.boolean(),
  }).index("by_code", ["code"]),

  settings: defineTable({
    key: v.string(),
    value: v.any(),
  }).index("by_key", ["key"]),

  capiLogs: defineTable({
    eventName: v.string(),
    eventId: v.string(),
    status: v.union(v.literal("ok"), v.literal("error"), v.literal("retry")),
    responseSummary: v.string(),
    attempt: v.number(),
  }),

  adminSessions: defineTable({
    token: v.string(),
    createdAt: v.number(),
    expiresAt: v.number(),
  }).index("by_token", ["token"]),
});
