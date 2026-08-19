import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib";
import { isValidSlug } from "../lib/validation";

export const bySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const lp = await ctx.db
      .query("landingPages")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!lp || lp.status !== "published") return null;
    const product = await ctx.db.get(lp.productId);
    if (!product || !product.active) return null;
    const images = [
      ...(
        await Promise.all(product.imageIds.map((id) => ctx.storage.getUrl(id)))
      ).filter(Boolean),
      ...(product.imageUrls ?? []),
    ];
    const ogImage = lp.og?.imageId ? await ctx.storage.getUrl(lp.og.imageId) : null;
    return {
      ...lp,
      ogImage,
      product: {
        ...product,
        images,
        price: lp.priceOverride ?? product.price,
        compareAtPrice: lp.compareAtOverride ?? product.compareAtPrice,
      },
    };
  },
});

export const recordView = mutation({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const lp = await ctx.db
      .query("landingPages")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (lp) await ctx.db.patch(lp._id, { views: lp.views + 1 });
  },
});

export const recordInitiate = mutation({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const lp = await ctx.db
      .query("landingPages")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (lp) await ctx.db.patch(lp._id, { initiates: lp.initiates + 1 });
  },
});

// ---------- Admin ----------

export const adminList = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireAdmin(ctx, token);
    const pages = await ctx.db.query("landingPages").order("desc").collect();
    return Promise.all(
      pages.map(async (p) => ({
        ...p,
        productName: (await ctx.db.get(p.productId))?.name ?? "(deleted)",
      }))
    );
  },
});

export const adminGet = query({
  args: { token: v.string(), id: v.id("landingPages") },
  handler: async (ctx, { token, id }) => {
    await requireAdmin(ctx, token);
    return await ctx.db.get(id);
  },
});

const pageFields = {
  slug: v.string(),
  title: v.string(),
  productId: v.id("products"),
  status: v.union(v.literal("draft"), v.literal("published")),
  sections: v.array(
    v.object({
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
      content: v.any(),
    })
  ),
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
};

export const create = mutation({
  args: { token: v.string(), data: v.object(pageFields) },
  handler: async (ctx, { token, data }) => {
    await requireAdmin(ctx, token);
    if (!isValidSlug(data.slug))
      throw new Error("Slug must be lowercase letters, numbers, hyphens");
    const dupe = await ctx.db
      .query("landingPages")
      .withIndex("by_slug", (q) => q.eq("slug", data.slug))
      .unique();
    if (dupe) throw new Error("Slug already in use");
    return await ctx.db.insert("landingPages", {
      ...data,
      views: 0,
      initiates: 0,
      ordersCount: 0,
    });
  },
});

export const update = mutation({
  args: { token: v.string(), id: v.id("landingPages"), data: v.object(pageFields) },
  handler: async (ctx, { token, id, data }) => {
    await requireAdmin(ctx, token);
    if (!isValidSlug(data.slug))
      throw new Error("Slug must be lowercase letters, numbers, hyphens");
    const dupe = await ctx.db
      .query("landingPages")
      .withIndex("by_slug", (q) => q.eq("slug", data.slug))
      .unique();
    if (dupe && dupe._id !== id) throw new Error("Slug already in use");
    await ctx.db.patch(id, data);
  },
});

export const duplicate = mutation({
  args: { token: v.string(), id: v.id("landingPages") },
  handler: async (ctx, { token, id }) => {
    await requireAdmin(ctx, token);
    const p = await ctx.db.get(id);
    if (!p) throw new Error("Not found");
    const { _id, _creationTime, ...rest } = p as any;
    return await ctx.db.insert("landingPages", {
      ...rest,
      slug: `${p.slug}-copy-${Math.floor(Math.random() * 10000)}`,
      status: "draft",
      views: 0,
      initiates: 0,
      ordersCount: 0,
    });
  },
});

export const remove = mutation({
  args: { token: v.string(), id: v.id("landingPages") },
  handler: async (ctx, { token, id }) => {
    await requireAdmin(ctx, token);
    await ctx.db.delete(id);
  },
});
