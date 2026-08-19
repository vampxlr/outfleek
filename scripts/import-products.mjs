// One-time import: generated-marketing-assets/ecommerce/*.png -> Convex products.
// Usage: node scripts/import-products.mjs <ADMIN_TOKEN>
import { ConvexHttpClient } from "convex/browser";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = readFileSync(resolve(root, ".env.local"), "utf8");
const url = process.env.CONVEX_URL ?? env.match(/NEXT_PUBLIC_CONVEX_URL=(.+)/)[1].trim();
const token = process.argv[2];
if (!token) throw new Error("Pass admin token as arg");

const client = new ConvexHttpClient(url);
const sizes = ["S", "M", "L", "XL", "XXL"];
const mkVariants = (color, stock) => sizes.map((size) => ({ size, color, stock }));

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

// 1. Category
await client.mutation("categories:save", {
  token, name: "Printed Shirts", slug: "printed-shirts", order: 0, active: true,
});
const cats = await client.query("categories:adminList", { token });
const catId = cats.find((c) => c.slug === "printed-shirts")._id;

// 2. Remove old seed placeholder products
const existing = await client.query("products:adminList", { token });
for (const p of existing) {
  if (p.imageIds.length === 0) {
    await client.mutation("products:remove", { token, id: p._id });
    console.log("removed seed:", p.name);
  }
}

// 3. Upload images + create products
for (const p of PRODUCTS) {
  const uploadUrl = await client.mutation("products:generateUploadUrl", { token });
  const bytes = readFileSync(resolve(root, "generated-marketing-assets/ecommerce", p.file));
  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": "image/png" },
    body: bytes,
  });
  const { storageId } = await res.json();
  await client.mutation("products:create", {
    token,
    data: {
      name: p.name, slug: p.slug, description: p.description,
      categoryId: catId, price: p.price, compareAtPrice: p.compareAt,
      imageIds: [storageId], variants: mkVariants(p.color, 20),
      badges: p.badges, active: true, placeholderHue: p.hue,
    },
  });
  console.log("created:", p.name);
}
console.log("Done.");
