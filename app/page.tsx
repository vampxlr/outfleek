"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCart } from "@/lib/cart";
import { firePixel } from "@/lib/tracking";
import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import Reveal from "@/components/store/Reveal";
import ProductVisual from "@/components/store/ProductVisual";

const tk = (n: number) => `৳${n.toLocaleString("en-IN")}`;
type Sort = "featured" | "low" | "high";

function HeroWords({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          className="inline-block whitespace-pre"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: delay + i * 0.07 }}
        >
          {w}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </span>
  );
}

export default function HomePage() {
  const [categorySlug, setCategorySlug] = useState("all");
  const [sort, setSort] = useState<Sort>("featured");
  const settings = useQuery(api.settings.publicSettings, {});
  const categories = useQuery(api.categories.list, {});
  const products = useQuery(api.products.list, { categorySlug });
  const mirror = useMutation(api.capiHelpers.mirrorEvent);
  const add = useCart((s) => s.add);

  const sorted = useMemo(() => {
    if (!products) return undefined;
    const list = [...products];
    if (sort === "low") list.sort((a, b) => a.price - b.price);
    if (sort === "high") list.sort((a, b) => b.price - a.price);
    return list;
  }, [products, sort]);

  const handleAdd = (p: NonNullable<typeof products>[number]) => {
    const inStock = p.variants.filter((v: { stock: number }) => v.stock > 0);
    const variant =
      inStock.find((v: { size: string }) => v.size === "M") ?? inStock[0];
    if (!variant) return;
    add({
      productId: p._id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      size: variant.size,
      color: variant.color,
      image: p.images[0] ?? null,
      placeholderHue: p.placeholderHue,
    });
    const t = firePixel("AddToCart", {
      content_ids: [p._id],
      value: p.price,
      currency: "BDT",
    });
    mirror({
      eventName: "AddToCart",
      eventId: t.eventId,
      customData: t.customData,
      fbc: t.fbc,
      fbp: t.fbp,
      userAgent: t.userAgent,
      sourceUrl: t.sourceUrl,
    }).catch(() => {});
  };

  return (
    <div className="min-h-screen bg-cream text-ink">
      <Header />

      {/* Hero */}
      <section className="mx-auto max-w-[1280px] border-b border-hairline px-5 pb-11 pt-14 text-center md:px-7 md:pb-14 md:pt-[72px]">
        <motion.div
          className="mb-5 text-[11px] uppercase tracking-[.34em] text-gold"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Premium Essentials · Bangladesh
        </motion.div>
        <h1 className="font-serif text-[clamp(34px,6.4vw,68px)] font-normal leading-[1.08]">
          <HeroWords text={String(settings?.heroHeadline ?? "Timeless Tees, Effortless Style")} delay={0.15} />
        </h1>
        <motion.p
          className="mx-auto mt-5 max-w-[520px] text-[15px] tracking-[.02em] text-muted"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          {String(settings?.heroTagline ?? "Premium cotton t-shirts, delivered anywhere in Bangladesh.")}
        </motion.p>
        <motion.div
          className="mx-auto mt-7 h-px w-14 bg-gold"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.6, delay: 0.85 }}
        />
      </section>

      {/* Toolbar */}
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center justify-between gap-4 px-5 pb-2 pt-6 md:px-7">
        <div className="flex flex-wrap gap-2.5">
          {[{ slug: "all", name: "All" }, ...(categories ?? [])].map((c) => {
            const active = categorySlug === c.slug;
            return (
              <button
                key={c.slug}
                onClick={() => setCategorySlug(c.slug)}
                className={`relative rounded-full border px-5 py-2 text-[11.5px] uppercase tracking-[.14em] transition-colors ${
                  active
                    ? "border-ink text-cream"
                    : "border-hairline text-muted hover:border-ink hover:text-ink"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="pill-bg"
                    className="absolute inset-0 rounded-full bg-ink"
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  />
                )}
                <span className="relative z-10">{c.name}</span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2.5 text-[11.5px] uppercase tracking-[.12em] text-muted">
          <label htmlFor="sort">Sort</label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="cursor-pointer border border-hairline bg-transparent px-3 py-2 text-xs tracking-[.08em] text-ink outline-none"
          >
            <option value="featured">Featured</option>
            <option value="low">Price: Low to High</option>
            <option value="high">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <main className="mx-auto max-w-[1280px] px-5 pb-20 pt-6 md:px-7">
        {sorted === undefined ? (
          <div className="grid grid-cols-2 gap-px border border-hairline bg-hairline md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-cream pb-6">
                <div className="aspect-[4/5] animate-pulse bg-[#f3f1ec]" />
                <div className="mx-auto mt-4 h-4 w-2/3 animate-pulse bg-[#f3f1ec]" />
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-24 text-center text-sm tracking-[.06em] text-muted">
            No products found in this collection yet.
          </div>
        ) : (
          <motion.div
            layout
            className="grid grid-cols-2 gap-px border border-hairline bg-hairline md:grid-cols-3 lg:grid-cols-4"
          >
            <AnimatePresence mode="popLayout">
              {sorted.map((p, i) => (
                <motion.article
                  key={p._id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(i, 6) * 0.05 }}
                  className="group relative bg-cream pb-6 transition-shadow duration-300 hover:z-10 hover:bg-white hover:shadow-[0_18px_40px_rgba(25,24,23,.10)]"
                >
                  <Link href={`/product/${p.slug}`} className="relative block aspect-[4/5] overflow-hidden">
                    <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-[1.07]">
                      <ProductVisual image={p.images[0]} hue={p.placeholderHue} name={p.name} />
                    </div>
                    {p.badges[0] && (
                      <span
                        className={`absolute left-3.5 top-3.5 z-10 px-2.5 py-1 text-[10px] uppercase tracking-[.16em] ${
                          p.badges[0] === "New" ? "bg-gold text-white" : "bg-ink text-cream"
                        }`}
                      >
                        {p.badges[0]}
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleAdd(p);
                      }}
                      className="absolute bottom-3.5 left-3.5 right-3.5 z-10 bg-ink px-2 py-3 text-[11px] uppercase tracking-[.2em] text-cream transition-all duration-300 hover:bg-gold sm:translate-y-2.5 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100"
                    >
                      Add to Cart
                    </button>
                  </Link>
                  <div className="px-3 pt-4 text-center md:px-4">
                    <div className="font-serif text-[15px] tracking-[.02em] md:text-[17px]">
                      <Link href={`/product/${p.slug}`} className="hover:text-gold">
                        {p.name}
                      </Link>
                    </div>
                    <div className="mt-2 text-sm tracking-[.04em]">
                      {p.compareAtPrice ? (
                        <span className="mr-2 text-[12.5px] text-[#a9a49b] line-through">
                          {tk(p.compareAtPrice)}
                        </span>
                      ) : null}
                      {tk(p.price)}
                    </div>
                  </div>
                </motion.article>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        <Reveal delay={0.1} className="mt-16 text-center">
          <div className="text-[11px] uppercase tracking-[.34em] text-gold">
            Cash on Delivery · bKash · Nagad
          </div>
        </Reveal>
      </main>

      <Footer />
    </div>
  );
}
