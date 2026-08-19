import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib";

export const validate = query({
  args: { code: v.string(), subtotal: v.number() },
  handler: async (ctx, { code, subtotal }) => {
    const promo = await ctx.db
      .query("promoCodes")
      .withIndex("by_code", (q) => q.eq("code", code.toUpperCase()))
      .unique();
    if (!promo || !promo.active) return { valid: false, reason: "Invalid code" };
    if (promo.expiresAt && promo.expiresAt < Date.now())
      return { valid: false, reason: "Code expired" };
    if (promo.maxUses && promo.uses >= promo.maxUses)
      return { valid: false, reason: "Code fully used" };
    if (promo.minOrder && subtotal < promo.minOrder)
      return { valid: false, reason: `Minimum order ৳${promo.minOrder}` };
    const discount =
      promo.kind === "percent"
        ? Math.round((subtotal * promo.value) / 100)
        : promo.value;
    return { valid: true, discount, code: promo.code };
  },
});

export const adminList = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireAdmin(ctx, token);
    return await ctx.db.query("promoCodes").collect();
  },
});

export const save = mutation({
  args: {
    token: v.string(),
    id: v.optional(v.id("promoCodes")),
    code: v.string(),
    kind: v.union(v.literal("percent"), v.literal("fixed")),
    value: v.number(),
    minOrder: v.optional(v.number()),
    maxUses: v.optional(v.number()),
    expiresAt: v.optional(v.number()),
    active: v.boolean(),
  },
  handler: async (ctx, { token, id, ...data }) => {
    await requireAdmin(ctx, token);
    const payload = { ...data, code: data.code.toUpperCase() };
    if (id) await ctx.db.patch(id, payload);
    else await ctx.db.insert("promoCodes", { ...payload, uses: 0 });
  },
});

export const remove = mutation({
  args: { token: v.string(), id: v.id("promoCodes") },
  handler: async (ctx, { token, id }) => {
    await requireAdmin(ctx, token);
    await ctx.db.delete(id);
  },
});
