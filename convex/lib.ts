import { QueryCtx, MutationCtx } from "./_generated/server";

export async function getSetting(
  ctx: QueryCtx | MutationCtx,
  key: string,
  fallback: unknown = null
) {
  const row = await ctx.db
    .query("settings")
    .withIndex("by_key", (q) => q.eq("key", key))
    .unique();
  return row ? row.value : fallback;
}

export async function requireAdmin(
  ctx: QueryCtx | MutationCtx,
  token: string
) {
  const session = await ctx.db
    .query("adminSessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();
  if (!session || session.expiresAt < Date.now()) {
    throw new Error("Unauthorized");
  }
  return session;
}

export const DEFAULT_SETTINGS: Record<string, unknown> = {
  storeName: "Outfleek",
  storeTagline: "Comfort in every thread",
  logoUrl: "",
  announcementBar: "Free delivery over ৳2000 · Cash on Delivery available",
  heroHeadline: "Timeless Tees, Effortless Style",
  heroTagline: "Premium cotton t-shirts, delivered anywhere in Bangladesh.",
  contactPhone: "01XXXXXXXXX",
  whatsapp: "",
  deliveryFeeDhaka: 80,
  deliveryFeeOutside: 130,
  freeDeliveryThreshold: 2000,
  codEnabled: true,
  bkashEnabled: true,
  bkashNumber: "01XXXXXXXXX",
  bkashInstructions:
    "Send Money to the bKash number above, then enter your bKash number and Transaction ID below.",
  pixelId: "",
  capiToken: "",
  testEventCode: "",
  testModeEnabled: false,
  returnPolicy: "7-day easy returns. Product must be unused with tags attached.",
  privacyPolicy: "We only use your information to deliver your order.",
};
