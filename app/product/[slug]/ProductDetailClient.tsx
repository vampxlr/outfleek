"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
const SIZE_ORDER = ["S", "M", "L", "XL", "XXL"];
type Tab = "desc" | "size" | "delivery";

export default function ProductDetailClient({ slug }: { slug: string }) {
  const router = useRouter();
  const product = useQuery(api.products.bySlug, { slug });
  const related = useQuery(api.products.list, {});
  const settings = useQuery(api.settings.publicSettings, {});
  const mirror = useMutation(api.capiHelpers.mirrorEvent);
  const add = useCart((s) => s.add);
  const setDrawer = useCart((s) => s.setDrawer);

  const [galleryIdx, setGalleryIdx] = useState(0);
  const [size, setSize] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [qty, setQtyState] = useState(1);
  const [tab, setTab] = useState<Tab>("desc");
  const viewedRef = useRef(false);

  // ViewContent once product loads
  useEffect(() => {
    if (!product || viewedRef.current) return;
    viewedRef.current = true;
    const t = firePixel("ViewContent", {
      content_ids: [product._id],
      value: product.price,
      currency: "BDT",
    });
    mirror({
      eventName: "ViewContent",
      eventId: t.eventId,
      customData: t.customData,
      fbc: t.fbc,
      fbp: t.fbp,
      userAgent: t.userAgent,
      sourceUrl: t.sourceUrl,
    }).catch(() => {});
  }, [product, mirror]);

  const sizes = useMemo(() => {
    if (!product) return [];
    const map = new Map<string, number>();
    for (const v of product.variants as { size: string; color: string; stock: number }[]) {
      map.set(v.size, (map.get(v.size) ?? 0) + v.stock);
    }
    return [...map.entries()]
      .sort(
        (a, b) =>
          (SIZE_ORDER.indexOf(a[0]) + 100) % 100 - ((SIZE_ORDER.indexOf(b[0]) + 100) % 100)
      )
      .map(([s, stock]) => ({ size: s, stock }));
  }, [product]);

  const colors = useMemo(() => {
    if (!product) return [];
    return [...new Set((product.variants as { color: string }[]).map((v) => v.color))];
  }, [product]);

  useEffect(() => {
    if (colors.length && !color) setColor(colors[0]);
  }, [colors, color]);

  // Gallery slides: real images or 4 hue variations
  const hue = product?.placeholderHue ?? 40;
  const slides: { image?: string | null; hue: number }[] = useMemo(() => {
    if (!product) return [];
    if (product.images.length > 0)
      return (product.images as string[]).map((img) => ({ image: img, hue }));
    return [hue, hue + 25, hue - 25, hue + 60].map((h) => ({
      hue: ((h % 360) + 360) % 360,
    }));
  }, [product, hue]);

  const relatedFour = useMemo(
    () => (related ?? []).filter((p) => p.slug !== slug).slice(0, 4),
    [related, slug]
  );

  if (product === undefined) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="py-40 text-center text-sm tracking-[.06em] text-muted">Loading…</div>
        <Footer />
      </div>
    );
  }
  if (product === null) {
    return (
      <div className="min-h-screen bg-cream">
        <Header />
        <div className="py-40 text-center">
          <h1 className="font-serif text-2xl">Product not found</h1>
          <Link href="/" className="mt-4 inline-block text-xs uppercase tracking-[.2em] text-gold">
            Back to shop
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const badge = product.badges[0] as string | undefined;
  const threshold = Number(settings?.freeDeliveryThreshold ?? 2000);

  const doAdd = () => {
    const chosenSize = size ?? sizes.find((s) => s.stock > 0)?.size ?? "M";
    add(
      {
        productId: product._id,
        slug: product.slug,
        name: product.name,
        price: product.price,
        size: chosenSize,
        color: color ?? undefined,
        image: product.images[0] ?? null,
        placeholderHue: product.placeholderHue,
      },
      qty
    );
    const t = firePixel("AddToCart", {
      content_ids: [product._id],
      value: product.price * qty,
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

  const tabs: { id: Tab; label: string }[] = [
    { id: "desc", label: "Description" },
    { id: "size", label: "Size Guide" },
    { id: "delivery", label: "Delivery & Returns" },
  ];

  return (
    <div className="min-h-screen bg-cream text-ink">
      <Header />

      {/* Breadcrumb */}
      <div className="mx-auto max-w-[1280px] px-5 pt-6 text-[11px] uppercase tracking-[.16em] text-[#a9a49b] md:px-7">
        <Link href="/" className="text-muted transition-colors hover:text-gold">
          Home
        </Link>
        <span className="mx-2 text-hairline">/</span>
        <span className="text-ink">{product.name}</span>
      </div>

      <main className="mx-auto grid max-w-[1280px] grid-cols-1 items-start gap-9 px-5 pb-16 pt-7 md:px-7 lg:grid-cols-[1.05fr_1fr] lg:gap-14">
        {/* Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="lg:sticky lg:top-24"
        >
          <div className="relative aspect-[4/5] overflow-hidden border border-hairline bg-[#f3f1ec]">
            <AnimatePresence mode="wait">
              <motion.div
                key={galleryIdx}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <ProductVisual
                  image={slides[galleryIdx]?.image}
                  hue={slides[galleryIdx]?.hue}
                  name={product.name}
                />
              </motion.div>
            </AnimatePresence>
            {badge && (
              <span
                className={`absolute left-4 top-4 z-10 px-2.5 py-1 text-[10px] uppercase tracking-[.16em] ${
                  badge === "New" ? "bg-gold text-white" : "bg-ink text-cream"
                }`}
              >
                {badge}
              </span>
            )}
          </div>
          {slides.length > 1 && (
            <div className="mt-2.5 grid grid-cols-4 gap-2.5">
              {slides.map((s, i) => (
                <button
                  key={i}
                  aria-label={`View ${i + 1}`}
                  onClick={() => setGalleryIdx(i)}
                  className={`relative aspect-[4/5] overflow-hidden border transition-colors ${
                    i === galleryIdx ? "border-gold" : "border-hairline hover:border-muted"
                  }`}
                >
                  <ProductVisual image={s.image} hue={s.hue} name={product.name} />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Info */}
        <div>
          <Reveal>
            <div className="mb-3 text-[11px] uppercase tracking-[.3em] text-gold">
              Premium Cotton
            </div>
            <h1 className="font-serif text-[clamp(28px,3.6vw,42px)] font-normal leading-[1.12]">
              {product.name}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-3.5">
              <span className="font-serif text-[26px] tracking-[.02em]">{tk(product.price)}</span>
              {product.compareAtPrice ? (
                <>
                  <span className="text-base text-[#a9a49b] line-through">
                    {tk(product.compareAtPrice)}
                  </span>
                  <span className="bg-gold px-2.5 py-1 text-[10px] uppercase tracking-[.16em] text-white">
                    Sale
                  </span>
                </>
              ) : null}
            </div>
            <div className="mb-5 mt-2 flex items-center gap-2.5 text-xs tracking-[.06em] text-muted">
              <span className="tracking-[2px] text-gold">★★★★★</span>
              <span>4.8 · 126 reviews</span>
            </div>
            <p className="max-w-[480px] border-t border-hairline pt-5 text-[14.5px] text-muted">
              {product.description}
            </p>
          </Reveal>

          <Reveal delay={0.08}>
            <div className="mb-3 mt-6 text-[11px] font-semibold uppercase tracking-[.22em]">
              Size{" "}
              <span className="ml-2 font-normal normal-case tracking-[.04em] text-muted">
                {size ? `— ${size}` : "— select a size"}
              </span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {sizes.map((s) => (
                <button
                  key={s.size}
                  disabled={s.stock <= 0}
                  onClick={() => setSize(s.size)}
                  className={`min-w-[52px] border px-3.5 py-2.5 text-xs tracking-[.12em] transition-colors ${
                    s.stock <= 0
                      ? "cursor-not-allowed border-hairline text-[#c9c4bb] line-through"
                      : size === s.size
                        ? "border-ink bg-ink text-cream"
                        : "border-hairline text-muted hover:border-ink hover:text-ink"
                  }`}
                >
                  {s.size}
                </button>
              ))}
            </div>
          </Reveal>

          {colors.length > 1 && (
            <Reveal delay={0.12}>
              <div className="mb-3 mt-6 text-[11px] font-semibold uppercase tracking-[.22em]">
                Colour{" "}
                <span className="ml-2 font-normal normal-case tracking-[.04em] text-muted">
                  {color ? `— ${color}` : ""}
                </span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`border px-3.5 py-2.5 text-xs tracking-[.12em] transition-colors ${
                      color === c
                        ? "border-gold text-ink"
                        : "border-hairline text-muted hover:border-ink hover:text-ink"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </Reveal>
          )}

          <Reveal delay={0.16}>
            <div className="mt-7 flex flex-wrap items-stretch gap-3.5">
              <div className="flex items-center border border-hairline">
                <button
                  aria-label="Decrease"
                  onClick={() => setQtyState((q) => Math.max(1, q - 1))}
                  className="h-full min-h-[50px] w-[42px] text-[17px] text-muted transition-colors hover:text-ink"
                >
                  −
                </button>
                <span className="w-[38px] text-center text-sm tracking-[.04em]">{qty}</span>
                <button
                  aria-label="Increase"
                  onClick={() => setQtyState((q) => Math.min(10, q + 1))}
                  className="h-full min-h-[50px] w-[42px] text-[17px] text-muted transition-colors hover:text-ink"
                >
                  +
                </button>
              </div>
              <button
                onClick={doAdd}
                className="min-w-[190px] flex-1 bg-ink px-5 py-4 text-xs uppercase tracking-[.22em] text-cream transition-colors hover:bg-gold"
              >
                Add to Cart
              </button>
            </div>
            <button
              onClick={() => {
                setDrawer(false);
                doAdd();
                setDrawer(false);
                router.push("/checkout");
              }}
              className="mt-3 block w-full border border-ink px-5 py-3.5 text-center text-xs uppercase tracking-[.22em] transition-colors hover:bg-ink hover:text-cream"
            >
              Order Now — Pay on Delivery
            </button>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-hairline pt-4 text-xs tracking-[.04em] text-muted">
              <span>🚚 Free delivery over {tk(threshold)}</span>
              <span>💵 Cash on Delivery</span>
              <span>📱 bKash accepted</span>
            </div>
          </Reveal>
        </div>
      </main>

      {/* Tabs */}
      <section className="mx-auto max-w-[1280px] px-5 pb-16 md:px-7">
        <div className="flex gap-5 overflow-x-auto border-b border-hairline md:gap-8">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`relative whitespace-nowrap px-0.5 py-4 text-xs uppercase tracking-[.18em] transition-colors ${
                tab === t.id ? "text-ink" : "text-muted"
              }`}
            >
              {t.label}
              {tab === t.id && (
                <motion.span
                  layoutId="tab-underline"
                  className="absolute -bottom-px left-0 right-0 h-0.5 bg-gold"
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                />
              )}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="max-w-[720px] pt-7 text-[14.5px] text-muted"
          >
            {tab === "desc" && (
              <>
                <h3 className="mb-3 font-serif text-xl font-normal text-ink">Crafted to last</h3>
                <p>{product.description}</p>
                <ul className="ml-5 mt-3 list-disc space-y-1.5">
                  <li>220 GSM premium combed cotton — soft, breathable, pre-shrunk</li>
                  <li>Reinforced shoulder-to-shoulder taping and double-needle hems</li>
                  <li>Cut, stitched and finished in small batches in Dhaka</li>
                  <li>Colour-fast dyes; wash cold, hang dry for best results</li>
                </ul>
              </>
            )}
            {tab === "size" && (
              <>
                <h3 className="mb-3 font-serif text-xl font-normal text-ink">
                  Size guide (in inches)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-[13px]">
                    <thead>
                      <tr>
                        {["Size", "Chest", "Length", "Sleeve", "Shoulder"].map((h) => (
                          <th
                            key={h}
                            className="border border-hairline bg-[#f3f1ec] px-3.5 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[.16em] text-ink"
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        ["S", "36", "26", "7.5", "16.5"],
                        ["M", "38", "27", "8", "17.5"],
                        ["L", "40", "28", "8.5", "18.5"],
                        ["XL", "42", "29", "9", "19.5"],
                        ["XXL", "44", "30", "9.5", "20.5"],
                      ].map((row) => (
                        <tr key={row[0]}>
                          {row.map((cell, i) => (
                            <td key={i} className="border border-hairline px-3.5 py-2.5 text-center">
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-3">Between sizes? We recommend sizing up for a relaxed fit.</p>
              </>
            )}
            {tab === "delivery" && (
              <>
                <h3 className="mb-3 font-serif text-xl font-normal text-ink">Delivery & returns</h3>
                <ul className="ml-5 list-disc space-y-1.5">
                  <li>
                    Inside Dhaka: 1–2 working days · {tk(Number(settings?.deliveryFeeDhaka ?? 80))}{" "}
                    (free over {tk(threshold)})
                  </li>
                  <li>Outside Dhaka: 2–4 working days via courier</li>
                  <li>Cash on Delivery, bKash and Nagad accepted nationwide</li>
                  <li>7-day easy exchange — unworn, with tags attached</li>
                </ul>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </section>

      {/* Related */}
      {relatedFour.length > 0 && (
        <section className="mx-auto max-w-[1280px] px-5 pb-20 md:px-7">
          <Reveal className="mb-8 text-center">
            <div className="mb-2.5 text-[11px] uppercase tracking-[.34em] text-gold">
              Complete the look
            </div>
            <h2 className="font-serif text-[clamp(24px,3.4vw,34px)] font-normal">
              You may also like
            </h2>
          </Reveal>
          <div className="grid grid-cols-2 gap-px border border-hairline bg-hairline lg:grid-cols-4">
            {relatedFour.map((p, i) => (
              <Reveal key={p._id} delay={i * 0.07}>
                <Link
                  href={`/product/${p.slug}`}
                  className="group block h-full bg-cream pb-6 transition-shadow duration-300 hover:bg-white hover:shadow-[0_18px_40px_rgba(25,24,23,.10)]"
                >
                  <div className="relative aspect-[4/5] overflow-hidden">
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
                  </div>
                  <div className="px-4 pt-4 text-center">
                    <div className="font-serif text-[15px] tracking-[.02em] md:text-[17px]">
                      {p.name}
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
                </Link>
              </Reveal>
            ))}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
