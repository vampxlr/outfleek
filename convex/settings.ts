import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { DEFAULT_SETTINGS, getSetting, requireAdmin } from "./lib";

const SECRET_KEYS = new Set(["capiToken"]);

// Public settings for the storefront (never exposes secrets)
export const publicSettings = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("settings").collect();
    const out: Record<string, unknown> = { ...DEFAULT_SETTINGS };
    for (const r of rows) out[r.key] = r.value;
    for (const k of SECRET_KEYS) delete out[k];
    return out;
  },
});

export const adminSettings = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireAdmin(ctx, token);
    const rows = await ctx.db.query("settings").collect();
    const out: Record<string, unknown> = { ...DEFAULT_SETTINGS };
    for (const r of rows) out[r.key] = r.value;
    // mask token but show whether it is set
    out.capiTokenSet = !!out.capiToken;
    delete out.capiToken;
    return out;
  },
});

export const updateSettings = mutation({
  args: { token: v.string(), entries: v.any() },
  handler: async (ctx, { token, entries }) => {
    await requireAdmin(ctx, token);
    for (const [key, value] of Object.entries(
      entries as Record<string, unknown>
    )) {
      if (!(key in DEFAULT_SETTINGS)) continue;
      // empty capiToken means "leave unchanged"
      if (key === "capiToken" && value === "") continue;
      const existing = await ctx.db
        .query("settings")
        .withIndex("by_key", (q) => q.eq("key", key))
        .unique();
      if (existing) await ctx.db.patch(existing._id, { value });
      else await ctx.db.insert("settings", { key, value });
    }
  },
});

export const getSecretSetting = query({
  args: { token: v.string(), key: v.string() },
  handler: async (ctx, { token, key }) => {
    await requireAdmin(ctx, token);
    return await getSetting(ctx, key, "");
  },
});
