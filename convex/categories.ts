import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const cats = await ctx.db.query("categories").collect();
    return cats
      .filter((c) => c.active)
      .sort((a, b) => a.order - b.order);
  },
});

export const adminList = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireAdmin(ctx, token);
    const cats = await ctx.db.query("categories").collect();
    return cats.sort((a, b) => a.order - b.order);
  },
});

export const save = mutation({
  args: {
    token: v.string(),
    id: v.optional(v.id("categories")),
    name: v.string(),
    slug: v.string(),
    order: v.number(),
    active: v.boolean(),
  },
  handler: async (ctx, { token, id, ...data }) => {
    await requireAdmin(ctx, token);
    if (id) await ctx.db.patch(id, data);
    else await ctx.db.insert("categories", data);
  },
});

export const remove = mutation({
  args: { token: v.string(), id: v.id("categories") },
  handler: async (ctx, { token, id }) => {
    await requireAdmin(ctx, token);
    await ctx.db.delete(id);
  },
});
