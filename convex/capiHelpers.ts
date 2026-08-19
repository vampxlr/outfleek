import { internalQuery, internalMutation, query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { getSetting, requireAdmin } from "./lib";

export const readToken = internalQuery({
  args: {},
  handler: async (ctx) => (await getSetting(ctx, "capiToken", "")) as string,
});

export const log = internalMutation({
  args: {
    eventName: v.string(),
    eventId: v.string(),
    status: v.union(v.literal("ok"), v.literal("error"), v.literal("retry")),
    responseSummary: v.string(),
    attempt: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("capiLogs", args);
  },
});

export const recentLogs = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireAdmin(ctx, token);
    return await ctx.db.query("capiLogs").order("desc").take(20);
  },
});

// Public: browser asks server to mirror a Pixel event via CAPI (dedup by eventId)
export const mirrorEvent = mutation({
  args: {
    eventName: v.union(
      v.literal("PageView"),
      v.literal("ViewContent"),
      v.literal("AddToCart"),
      v.literal("InitiateCheckout"),
      v.literal("AddPaymentInfo")
    ),
    eventId: v.string(),
    customData: v.optional(v.any()),
    fbc: v.optional(v.string()),
    fbp: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.scheduler.runAfter(0, internal.capi.sendEvent, {
      ...args,
      attempt: 1,
    });
  },
});
