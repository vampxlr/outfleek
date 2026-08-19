import { mutation } from "./_generated/server";

// One-time dev seed: categories + a few shirts (small catalog, per requirements).
export const run = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("products").first();
    if (existing) return "Already seeded";

    const cats = [
      { name: "T-Shirts", slug: "t-shirts", order: 1, active: true },
      { name: "Polos", slug: "polos", order: 2, active: true },
      { name: "Drop Shoulder", slug: "drop-shoulder", order: 3, active: true },
    ];
    const catIds: Record<string, any> = {};
    for (const c of cats) catIds[c.slug] = await ctx.db.insert("categories", c);

    const sizes = ["S", "M", "L", "XL", "XXL"];
    const mkVariants = (color: string, stock: number) =>
      sizes.map((size) => ({ size, color, stock }));

    const products = [
      {
        name: "Essential Black Tee",
        slug: "essential-black-tee",
        description:
          "Our signature premium cotton tee in jet black. 180 GSM combed cotton, pre-shrunk, bio-washed for softness. The one t-shirt every wardrobe needs.",
        categoryId: catIds["t-shirts"],
        price: 590,
        compareAtPrice: 790,
        imageIds: [],
        variants: mkVariants("Black", 25),
        badges: ["Hot"],
        active: true,
        placeholderHue: 220,
      },
      {
        name: "Classic White Tee",
        slug: "classic-white-tee",
        description:
          "Crisp white premium cotton tee. 180 GSM, holds its shape wash after wash. Pairs with everything.",
        categoryId: catIds["t-shirts"],
        price: 590,
        imageIds: [],
        variants: mkVariants("White", 30),
        badges: ["New"],
        active: true,
        placeholderHue: 40,
      },
      {
        name: "Sage Green Drop Shoulder",
        slug: "sage-drop-shoulder",
        description:
          "Relaxed-fit drop shoulder tee in muted sage. 200 GSM heavyweight cotton, boxy cut, streetwear silhouette.",
        categoryId: catIds["drop-shoulder"],
        price: 750,
        compareAtPrice: 950,
        imageIds: [],
        variants: mkVariants("Sage", 18),
        badges: ["Sale"],
        active: true,
        placeholderHue: 140,
      },
      {
        name: "Navy Premium Polo",
        slug: "navy-premium-polo",
        description:
          "Piqué knit polo in deep navy. Ribbed collar and cuffs, mother-of-pearl style buttons. Office to evening.",
        categoryId: catIds["polos"],
        price: 890,
        imageIds: [],
        variants: mkVariants("Navy", 15),
        badges: [],
        active: true,
        placeholderHue: 215,
      },
      {
        name: "Charcoal Oversized Tee",
        slug: "charcoal-oversized-tee",
        description:
          "Heavyweight 220 GSM oversized tee in washed charcoal. Dropped shoulders, extended hem.",
        categoryId: catIds["drop-shoulder"],
        price: 790,
        compareAtPrice: 990,
        imageIds: [],
        variants: mkVariants("Charcoal", 20),
        badges: ["Hot", "Sale"],
        active: true,
        placeholderHue: 260,
      },
    ];
    for (const p of products) await ctx.db.insert("products", p);
    return `Seeded ${cats.length} categories, ${products.length} products`;
  },
});
