import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const SESSION_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days

// Admin password comes from Convex env var ADMIN_PASSWORD (set via dashboard/CLI).
export const login = mutation({
  args: { password: v.string() },
  handler: async (ctx, { password }) => {
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) throw new Error("ADMIN_PASSWORD not configured");
    if (password !== expected) throw new Error("Wrong password");
    const token = crypto.randomUUID() + crypto.randomUUID();
    await ctx.db.insert("adminSessions", {
      token,
      createdAt: Date.now(),
      expiresAt: Date.now() + SESSION_TTL,
    });
    return { token };
  },
});

export const check = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const s = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    return !!s && s.expiresAt > Date.now();
  },
});

export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const s = await ctx.db
      .query("adminSessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (s) await ctx.db.delete(s._id);
  },
});
