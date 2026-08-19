import { internalAction, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// One-time production bootstrap: copies product images + logo from the dev
// deployment's public storage URLs into THIS deployment's storage, then
// creates categories, products, branding settings, and the sample landing
// page. Idempotent: skips if products already exist.
// Run: npx convex run bootstrap:run --prod

const DEV = "https://handsome-hornet-178.convex.cloud/api/storage";
const IMAGES: Record<string, string> = {
  "noir-pinstripe-bloom-shirt": "da59b5bb-6040-435b-b7c7-0e25f9615bcd",
  logo: "548d7d20-f1f4-4b46-86b6-d1a8163baa4d",
};

const sizes = ["S", "M", "L", "XL", "XXL"];
const mkVariants = (color: string, stock: number) =>
  sizes.map((size) => ({ size, color, stock }));

const PRODUCTS = [
  { file: "black.png", name: "Noir Pinstripe Bloom Shirt", slug: "noir-pinstripe-bloom-shirt", color: "Black/Red", hue: 350, price: 1490, compareAt: 1890, badges: ["Hot"],
    description: "Statement long-sleeve shirt in jet black with fine crimson pinstripes and bold scarlet bloom print. Premium oxford cotton, classic collar, brass-tone buttons. Cut for a sharp, tailored drape." },
  { file: "blue.png", name: "Sky Doodle Blossom Shirt", slug: "sky-doodle-blossom-shirt", color: "Sky Blue", hue: 205, price: 1490, compareAt: 1890, badges: ["New"],
    description: "Light sky-blue oxford shirt with tonal stripes and hand-drawn black blossom motifs. Breathable premium cotton, perfect for daytime outings and smart-casual looks." },
  { file: "red.png", name: "Maroon Stripe Blossom Shirt", slug: "maroon-stripe-blossom-shirt", color: "Maroon", hue: 345, price: 1490, compareAt: 1890, badges: [],
    description: "Deep maroon long-sleeve shirt with black pinstripes and brushed blossom print. Rich, festive color that stands out — premium oxford weave with a soft hand-feel." },
  { file: "white.png", name: "Ivory Daisy Pinstripe Shirt", slug: "ivory-daisy-pinstripe-shirt", color: "Ivory", hue: 40, price: 1490, compareAt: 1890, badges: ["New"],
    description: "Crisp ivory shirt with fine black pinstripes and playful daisy print. A modern classic — premium oxford cotton, mother-of-pearl style buttons, curved hem." },
  { file: "flower-black-white.png", name: "Monochrome Leaf Print Shirt", slug: "monochrome-leaf-print-shirt", color: "White/Black", hue: 220, price: 1590, compareAt: 1990, badges: ["Hot"],
    description: "Elegant white long-sleeve shirt covered in a monochrome leaf-vine print. Refined all-over pattern that works from office to evening. Premium oxford cotton." },
  { file: "flower-off-white.png", name: "Autumn Leaf Print Shirt", slug: "autumn-leaf-print-shirt", color: "Off-White", hue: 30, price: 1590, compareAt: 1990, badges: [],
    description: "Warm off-white shirt with an autumn-toned leaf-vine print in beige and brown. Soft, earthy, effortlessly premium — oxford cotton with a classic collar." },
  { file: "grey-white.png", name: "Slate Abstract Print Shirt", slug: "slate-abstract-print-shirt", color: "Slate Grey", hue: 215, price: 1590, compareAt: 1990, badges: ["Sale"],
    description: "Bold slate-grey shirt with a sweeping white abstract botanical print. A head-turner for evenings and events. Premium oxford cotton, tailored fit." },
];

// Dev-deployment storage UUIDs per product image, discovered at authoring time.
const PRODUCT_IMAGE_UUIDS: Record<string, string[]> = {}; // filled by run() via dev products list

export const run = internalAction({
  args: {},
  handler: async (ctx): Promise<string> => {
    // Pull the dev product list (public query) to learn each product's image URLs
    const devRes = await fetch(
      "https://handsome-hornet-178.convex.cloud/api/query",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: "products:list", args: {}, format: "json" }),
      }
    );
    const devJson = await devRes.json();
    const devProducts: any[] = devJson.value ?? [];

    const images: Record<string, string[]> = {};
    for (const p of devProducts) images[p.slug] = p.images ?? [];

    // Copy each image into this deployment's storage
    const stored: Record<string, string[]> = {};
    for (const p of PRODUCTS) {
      stored[p.slug] = [];
      for (const url of images[p.slug] ?? []) {
        const res = await fetch(url);
        const blob = await res.blob();
        const id = await ctx.storage.store(blob);
        stored[p.slug].push(id);
      }
    }
    // Logo
    const logoRes = await fetch(`${DEV}/${IMAGES.logo}`);
    const logoId = await ctx.storage.store(await logoRes.blob());
    const logoUrl = (await ctx.storage.getUrl(logoId)) ?? "";

    const result = await ctx.runMutation(internal.bootstrap.write, {
      stored,
      logoUrl,
    });
    return result;
  },
});

export const write = internalMutation({
  args: { stored: v.any(), logoUrl: v.string() },
  handler: async (ctx, { stored, logoUrl }) => {
    const existing = await ctx.db.query("products").first();
    if (existing) return "Already bootstrapped";

    const catId = await ctx.db.insert("categories", {
      name: "Printed Shirts",
      slug: "printed-shirts",
      order: 0,
      active: true,
    });

    const bySlug: Record<string, any> = {};
    for (const p of PRODUCTS) {
      bySlug[p.slug] = await ctx.db.insert("products", {
        name: p.name,
        slug: p.slug,
        description: p.description,
        categoryId: catId,
        price: p.price,
        compareAtPrice: p.compareAt,
        imageIds: (stored[p.slug] ?? []) as any,
        variants: mkVariants(p.color, 20),
        badges: p.badges,
        active: true,
        placeholderHue: p.hue,
      });
    }

    const settings: Record<string, unknown> = {
      storeName: "Outfleek",
      storeTagline: "Comfort in every thread",
      logoUrl,
      heroHeadline: "Comfort in Every Thread",
      heroTagline: "Premium printed shirts, delivered anywhere in Bangladesh.",
    };
    for (const [key, value] of Object.entries(settings)) {
      await ctx.db.insert("settings", { key, value });
    }

    await ctx.db.insert("landingPages", {
      slug: "noir-bloom-offer",
      title: "Noir Pinstripe Bloom — Limited Offer",
      productId: bySlug["noir-pinstripe-bloom-shirt"],
      status: "published",
      priceOverride: 1290,
      compareAtOverride: 1890,
      og: {
        title: "Noir Pinstripe Bloom Shirt — ৳1290 Today Only",
        description: "Premium oxford statement shirt. Cash on Delivery across Bangladesh.",
      },
      views: 0,
      initiates: 0,
      ordersCount: 0,
      sections: [
        { type: "hero", enabled: true, content: {
          headline: "The Shirt That Does the Talking",
          subheadline: "Jet-black oxford with crimson pinstripes & bold bloom print. Premium 100% cotton — today at ৳1290 instead of ৳1890.",
          ctaText: "Order Now — Cash on Delivery",
        }},
        { type: "benefits", enabled: true, content: { items: [
          "Premium oxford cotton — soft, breathable, no fade after washing",
          "Sharp tailored fit with classic collar & brass-tone buttons",
          "Free delivery on orders over ৳2000 — pay cash on delivery",
          "7-day easy returns, no questions asked",
        ]}},
        { type: "gallery", enabled: true, content: { useProductImages: true } },
        { type: "reviews", enabled: true, content: { items: [
          { name: "Rafi H.", text: "Fabric quality is honestly better than brands double the price. Fits perfect.", stars: 5 },
          { name: "Tanvir A.", text: "Ordered Sunday, got it Tuesday in Chattogram. The print looks even better in person.", stars: 5 },
          { name: "Sadia K.", text: "Bought for my husband — he wears it every Friday now. Will order the blue one too.", stars: 4 },
        ]}},
        { type: "offer", enabled: true, content: {
          showCountdown: true, countdownMinutes: 30,
          showStock: true, stockText: "Only a few pieces left in this drop",
        }},
        { type: "sizeChart", enabled: true, content: { rows: [
          { size: "S", chest: "38\"", length: "27\"" },
          { size: "M", chest: "40\"", length: "28\"" },
          { size: "L", chest: "42\"", length: "29\"" },
          { size: "XL", chest: "44\"", length: "30\"" },
          { size: "XXL", chest: "46\"", length: "31\"" },
        ]}},
        { type: "faq", enabled: true, content: { items: [
          { q: "How do I pay?", a: "Cash on Delivery anywhere in Bangladesh, or bKash Send Money — your choice at checkout." },
          { q: "How long does delivery take?", a: "1–2 days inside Dhaka, 2–4 days outside. Delivery is free over ৳2000." },
          { q: "What if the size doesn't fit?", a: "7-day easy exchange — just message us and we'll swap the size." },
          { q: "Is the color exactly like the photos?", a: "Yes — photos are of the actual product. Slight variation may occur by screen." },
        ]}},
        { type: "orderForm", enabled: true, content: { buttonText: "Confirm Order — ৳1290" } },
      ],
    });

    return "Bootstrapped: 7 products, branding, landing page";
  },
});
