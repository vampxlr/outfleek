// Upload logo, set Outfleek branding, create a sample published landing page.
// Usage: node scripts/setup-brand.mjs <ADMIN_TOKEN>
import { ConvexHttpClient } from "convex/browser";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = readFileSync(resolve(root, ".env.local"), "utf8");
const url = process.env.CONVEX_URL ?? env.match(/NEXT_PUBLIC_CONVEX_URL=(.+)/)[1].trim();
const token = process.argv[2];
const client = new ConvexHttpClient(url);

// 1. Upload logo
const uploadUrl = await client.mutation("products:generateUploadUrl", { token });
const bytes = readFileSync(resolve(root, "generated-marketing-assets/logo.png"));
const res = await fetch(uploadUrl, {
  method: "POST",
  headers: { "Content-Type": "image/jpeg" },
  body: bytes,
});
const { storageId } = await res.json();
// storage URL is deterministic via a query — but simplest: settings stores the public URL.
// Convex storage public URL: {deployment}/api/storage/{uuid} — we get it via a product-style trick:
// instead, store the storageId-based URL fetched through landing og? Simpler: hit the storage URL via a tiny query.
// We'll use the fact that products.withImages resolves URLs: create no product — instead use a direct HTTP fetch of getUrl via a one-off:
console.log("logo storageId:", storageId);

// Resolve URL by creating a throwaway... not needed: settings.logoUrl accepts any URL; use the storage HTTP endpoint pattern from an existing product image.
// Fetch an existing product to learn the base URL:
const products = await client.query("products:adminList", { token });
const sample = products.find((p) => p.images && p.images.length);
const base = sample.images[0].split("/api/storage/")[0];
// We still need the file UUID for our new storageId — Convex maps id->url server-side only.
// Workaround: temporarily attach to a product? Cleaner: patch first product imageIds to include logo, read URL, then revert.
const p0 = products[0];
const { _id, _creationTime, images, ...rest } = p0;
await client.mutation("products:update", {
  token, id: _id,
  data: { ...rest, imageIds: [...p0.imageIds, storageId] },
});
const refreshed = await client.query("products:adminList", { token });
const p0r = refreshed.find((p) => p._id === _id);
const logoUrl = p0r.images[p0r.images.length - 1 - (p0.imageUrls?.length ?? 0)];
await client.mutation("products:update", {
  token, id: _id,
  data: { ...rest, imageIds: p0.imageIds },
});
console.log("logoUrl:", logoUrl);

// 2. Branding settings
await client.mutation("settings:updateSettings", {
  token,
  entries: {
    storeName: "Outfleek",
    storeTagline: "Comfort in every thread",
    logoUrl,
    heroHeadline: "Comfort in Every Thread",
    heroTagline: "Premium printed shirts, delivered anywhere in Bangladesh.",
  },
});
console.log("branding set");

// 3. Sample landing page for the Noir Pinstripe Bloom Shirt
const noir = products.find((p) => p.slug === "noir-pinstripe-bloom-shirt");
const existingPages = await client.query("landingPages:adminList", { token });
if (!existingPages.find((l) => l.slug === "noir-bloom-offer")) {
  await client.mutation("landingPages:create", {
    token,
    data: {
      slug: "noir-bloom-offer",
      title: "Noir Pinstripe Bloom — Limited Offer",
      productId: noir._id,
      status: "published",
      priceOverride: 1290,
      compareAtOverride: 1890,
      og: {
        title: "Noir Pinstripe Bloom Shirt — ৳1290 Today Only",
        description: "Premium oxford statement shirt. Cash on Delivery across Bangladesh.",
      },
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
    },
  });
  console.log("landing page created: /l/noir-bloom-offer");
}
console.log("Done.");
