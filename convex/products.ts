import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "./lib";

async function withImages(ctx: any, p: any) {
  const stored = await Promise.all(
    (p.imageIds ?? []).map((id: any) => ctx.storage.getUrl(id))
  );
  return { ...p, images: [...stored.filter(Boolean), ...(p.imageUrls ?? [])] };
}

export const list = query({
  args: { categorySlug: v.optional(v.string()) },
  handler: async (ctx, { categorySlug }) => {
    let products = await ctx.db
      .query("products")
      .withIndex("by_active", (q) => q.eq("active", true))
      .collect();
    if (categorySlug && categorySlug !== "all") {
      const cat = await ctx.db
        .query("categories")
        .withIndex("by_slug", (q) => q.eq("slug", categorySlug))
        .unique();
      if (cat) products = products.filter((p) => p.categoryId === cat._id);
    }
    return Promise.all(products.map((p) => withImages(ctx, p)));
  },
});

export const bySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const p = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!p || !p.active) return null;
    return withImages(ctx, p);
  },
});

export const adminList = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireAdmin(ctx, token);
    const products = await ctx.db.query("products").collect();
    return Promise.all(products.map((p) => withImages(ctx, p)));
  },
});

const productFields = {
  name: v.string(),
  slug: v.string(),
  description: v.string(),
  categoryId: v.optional(v.id("categories")),
  price: v.number(),
  compareAtPrice: v.optional(v.number()),
  cost: v.optional(v.number()),
  imageIds: v.array(v.id("_storage")),
  imageUrls: v.optional(v.array(v.string())),
  variants: v.array(
    v.object({ size: v.string(), color: v.string(), stock: v.number() })
  ),
  badges: v.array(v.string()),
  active: v.boolean(),
  placeholderHue: v.optional(v.number()),
};

export const create = mutation({
  args: { token: v.string(), data: v.object(productFields) },
  handler: async (ctx, { token, data }) => {
    await requireAdmin(ctx, token);
    const dupe = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", data.slug))
      .unique();
    if (dupe) throw new Error("Slug already in use");
    return await ctx.db.insert("products", data);
  },
});

export const update = mutation({
  args: {
    token: v.string(),
    id: v.id("products"),
    data: v.object(productFields),
  },
  handler: async (ctx, { token, id, data }) => {
    await requireAdmin(ctx, token);
    const dupe = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", data.slug))
      .unique();
    if (dupe && dupe._id !== id) throw new Error("Slug already in use");
    await ctx.db.patch(id, data);
  },
});

export const remove = mutation({
  args: { token: v.string(), id: v.id("products") },
  handler: async (ctx, { token, id }) => {
    await requireAdmin(ctx, token);
    await ctx.db.delete(id);
  },
});

export const generateUploadUrl = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireAdmin(ctx, token);
    return await ctx.storage.generateUploadUrl();
  },
});
