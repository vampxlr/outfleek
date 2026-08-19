"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AnimatePresence, motion } from "framer-motion";
import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import ProductVisual from "@/components/store/ProductVisual";
import Reveal from "@/components/store/Reveal";
import { useCart, cartSubtotal, cartCount } from "@/lib/cart";

const tk = (n: number) => `৳${n.toLocaleString("en-IN")}`;

export default function CartPage() {
  const { items, setQty, remove } = useCart();
  const settings = useQuery(api.settings.publicSettings, {}) as
    | Record<string, any>
    | undefined;

  const [area, setArea] = useState<"dhaka" | "outside">("dhaka");
  const [codeInput, setCodeInput] = useState("");
  const [checkCode, setCheckCode] = useState<string | null>(null);
  const [applied, setApplied] = useState<{ code: string; discount: number } | null>(null);
  const [promoMsg, setPromoMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const subtotal = cartSubtotal(items);
  const count = cartCount(items);

  const validation = useQuery(
    api.promoCodes.validate,
    checkCode ? { code: checkCode, subtotal } : "skip"
  );

  // React to validation result once it arrives
  useEffect(() => {
    if (!checkCode || validation === undefined) return;
    if (validation.valid) {
      setApplied({ code: validation.code!, discount: validation.discount! });
      setPromoMsg({ ok: true, text: `Code ${validation.code} applied — you save ${tk(validation.discount!)}` });
    } else {
      setApplied(null);
      setPromoMsg({ ok: false, text: validation.reason ?? "Invalid code" });
    }
    setCheckCode(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validation]);

  const threshold = Number(settings?.freeDeliveryThreshold ?? 2000);
  const feeDhaka = Number(settings?.deliveryFeeDhaka ?? 80);
  const feeOutside = Number(settings?.deliveryFeeOutside ?? 130);
  const freeDelivery = subtotal >= threshold;
  const deliveryFee = items.length === 0 || freeDelivery ? 0 : area === "dhaka" ? feeDhaka : feeOutside;
  const discount = applied ? Math.min(applied.discount, subtotal) : 0;
  const total = Math.max(0, subtotal - discount) + deliveryFee;
  const progress = Math.min(100, Math.round((subtotal / threshold) * 100));

  const applyPromo = () => {
    const c = codeInput.trim().toUpperCase();
    if (!c) return;
    setPromoMsg(null);
    setCheckCode(c);
  };

  const proceed = () => {
    try {
      if (applied) sessionStorage.setItem("promo", JSON.stringify(applied));
      else sessionStorage.removeItem("promo");
    } catch {}
  };

  return (
    <div className="min-h-screen bg-cream text-ink flex flex-col">
      <Header />

      {/* Page head */}
      <section className="max-w-[1280px] mx-auto w-full px-5 sm:px-7 pt-14 pb-8 text-center border-b border-hairline">
        <Reveal>
          <div className="text-[11px] tracking-[0.34em] uppercase text-gold mb-3">Shopping Bag</div>
          <h1 className="font-serif font-normal text-[clamp(32px,5vw,52px)] leading-[1.1]">
            Your <em className="text-gold">Cart</em>
          </h1>
          <div className="mt-3 text-muted text-[13px] tracking-[0.1em] uppercase">
            {count} {count === 1 ? "item" : "items"}
          </div>
          <div className="w-14 h-px bg-gold mx-auto mt-6" />
        </Reveal>
      </section>

      <main className="max-w-[1280px] mx-auto w-full px-5 sm:px-7 py-11 pb-24 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-11 items-start flex-1">
        {items.length === 0 ? (
          <div className="lg:col-span-2 text-center py-[70px]">
            <span className="block text-5xl opacity-40 mb-5">👜</span>
            <h2 className="font-serif font-normal text-[28px] mb-2">Your cart is empty</h2>
            <p className="text-muted text-sm tracking-[0.04em] mb-7">
              Discover our collection of premium tees.
            </p>
            <Link
              href="/"
              className="inline-block bg-ink text-cream px-10 py-4 text-xs tracking-[0.22em] uppercase hover:bg-gold transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        ) : (
          <>
            {/* Free delivery progress */}
            <div className="lg:col-span-2 border border-hairline bg-white px-5 py-4">
              <div className={`text-xs tracking-[0.12em] uppercase mb-2.5 ${freeDelivery ? "text-ink" : "text-muted"}`}>
                {freeDelivery ? (
                  <>You&rsquo;ve unlocked <b className="text-gold font-semibold">free delivery</b> 🎉</>
                ) : (
                  <>Add <b className="text-gold font-semibold">{tk(threshold - subtotal)}</b> more for free delivery</>
                )}
              </div>
              <div className="h-[3px] bg-hairline relative overflow-hidden">
                <motion.div
                  className="absolute left-0 top-0 bottom-0 bg-gold"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.9, ease: [0.2, 0.8, 0.2, 1] }}
                />
              </div>
            </div>

            {/* Line items */}
            <div className="border-t border-hairline">
              <AnimatePresence initial={false}>
                {items.map((it) => (
                  <motion.div
                    key={`${it.productId}-${it.size}`}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 40, height: 0, paddingTop: 0, paddingBottom: 0, overflow: "hidden" }}
                    transition={{ duration: 0.35 }}
                    className="grid grid-cols-[80px_1fr_auto] sm:grid-cols-[96px_1fr_auto] gap-4 sm:gap-5 py-6 border-b border-hairline items-center"
                  >
                    <Link href={`/product/${it.slug}`} className="w-20 sm:w-24 h-[100px] sm:h-[120px] border border-hairline flex items-center justify-center overflow-hidden">
                      <ProductVisual image={it.image} hue={it.placeholderHue} name={it.name} className="w-full h-full" />
                    </Link>
                    <div>
                      <div className="font-serif text-[17px] sm:text-lg tracking-[0.02em]">
                        <Link href={`/product/${it.slug}`} className="hover:text-gold transition-colors">
                          {it.name}
                        </Link>
                      </div>
                      <div className="text-xs text-muted mt-1 tracking-[0.08em] uppercase">
                        Size {it.size}
                        {it.color ? ` · ${it.color}` : ""}
                      </div>
                      <div className="text-[13px] text-muted mt-1.5 tracking-[0.04em]">{tk(it.price)} each</div>
                      <div className="flex items-center border border-hairline mt-3.5 w-max bg-white">
                        <button
                          aria-label="Decrease quantity"
                          className="w-[34px] h-[34px] text-muted hover:bg-cream hover:text-ink transition-colors"
                          onClick={() => setQty(it.productId, it.size, it.qty - 1)}
                        >
                          −
                        </button>
                        <span className="w-9 text-center text-[13px]">{it.qty}</span>
                        <button
                          aria-label="Increase quantity"
                          className="w-[34px] h-[34px] text-muted hover:bg-cream hover:text-ink transition-colors"
                          onClick={() => setQty(it.productId, it.size, it.qty + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-3.5">
                      <motion.div
                        key={it.price * it.qty}
                        initial={{ scale: 1.15, color: "#b8975a" }}
                        animate={{ scale: 1, color: "#1a1a1a" }}
                        transition={{ duration: 0.3 }}
                        className="font-serif text-[17px] tracking-[0.02em]"
                      >
                        {tk(it.price * it.qty)}
                      </motion.div>
                      <button
                        className="text-[10.5px] tracking-[0.16em] uppercase text-muted hover:text-red-700 transition-colors"
                        onClick={() => remove(it.productId, it.size)}
                      >
                        Remove
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              <Link
                href="/"
                className="inline-block mt-6 text-xs tracking-[0.18em] uppercase text-muted hover:text-gold transition-colors"
              >
                ← Continue Shopping
              </Link>
            </div>

            {/* Summary */}
            <aside className="lg:sticky lg:top-24 border border-hairline bg-white p-7">
              <h3 className="font-serif font-normal text-xl tracking-[0.06em] mb-5 pb-4 border-b border-hairline">
                Order Summary
              </h3>
              <div className="flex justify-between text-[13px] tracking-[0.06em] text-muted mb-2.5">
                <span>Subtotal</span>
                <span className="text-ink">{tk(subtotal)}</span>
              </div>

              <div className="my-3.5">
                <div className="text-[10.5px] tracking-[0.18em] uppercase text-muted mb-2">Delivery Area</div>
                <div className="flex gap-2">
                  {(
                    [
                      ["dhaka", "Inside Dhaka", feeDhaka],
                      ["outside", "Outside Dhaka", feeOutside],
                    ] as const
                  ).map(([key, label, fee]) => (
                    <button
                      key={key}
                      onClick={() => setArea(key)}
                      className={`flex-1 border px-1.5 py-2 text-[11px] tracking-[0.1em] uppercase transition-colors ${
                        area === key
                          ? "bg-ink border-ink text-cream"
                          : "border-hairline text-muted hover:border-ink hover:text-ink"
                      }`}
                    >
                      {label}
                      <span className="block text-[10px] normal-case tracking-normal mt-0.5 opacity-70">
                        {freeDelivery ? "Free" : tk(fee)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between text-[13px] tracking-[0.06em] text-muted mb-2.5">
                <span>Delivery</span>
                <motion.span key={deliveryFee} initial={{ scale: 1.1 }} animate={{ scale: 1 }} className="text-ink">
                  {deliveryFee === 0 ? "Free" : tk(deliveryFee)}
                </motion.span>
              </div>

              {/* Promo */}
              <div className="flex mt-4 mb-1">
                <input
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && applyPromo()}
                  placeholder="PROMO CODE"
                  className="flex-1 min-w-0 border border-hairline border-r-0 px-3.5 py-3 text-xs tracking-[0.1em] uppercase bg-transparent outline-none focus:border-gold text-ink placeholder:text-muted/60"
                />
                <button
                  onClick={applyPromo}
                  className="border border-ink bg-ink text-cream px-4 text-[11px] tracking-[0.18em] uppercase hover:bg-gold hover:border-gold transition-colors"
                >
                  Apply
                </button>
              </div>
              <div className="min-h-[18px] mb-2">
                <AnimatePresence mode="wait">
                  {promoMsg && (
                    <motion.div
                      key={promoMsg.text}
                      initial={promoMsg.ok ? { scale: 0.85, opacity: 0 } : { x: -6, opacity: 0 }}
                      animate={{ scale: 1, x: 0, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className={`text-[11.5px] tracking-[0.08em] ${promoMsg.ok ? "text-gold" : "text-red-700"}`}
                    >
                      {promoMsg.text}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {discount > 0 && (
                <div className="flex justify-between text-[13px] tracking-[0.06em] text-gold mb-2.5">
                  <span>Discount ({applied?.code})</span>
                  <span>−{tk(discount)}</span>
                </div>
              )}

              <div className="flex justify-between font-serif text-lg text-ink border-t border-hairline pt-3.5 mt-3.5">
                <span>Total</span>
                <motion.span key={total} initial={{ scale: 1.1, color: "#b8975a" }} animate={{ scale: 1, color: "#1a1a1a" }}>
                  {tk(total)}
                </motion.span>
              </div>

              <Link
                href="/checkout"
                onClick={proceed}
                className="block w-full bg-ink text-cream text-center py-4 text-xs tracking-[0.22em] uppercase hover:bg-gold transition-colors mt-4"
              >
                Proceed to Checkout
              </Link>

              <div className="flex gap-2 flex-wrap mt-4">
                <span className="border border-hairline px-3.5 py-1.5 text-[11px] tracking-[0.08em] font-semibold text-bkash">bKash</span>
                <span className="border border-hairline px-3.5 py-1.5 text-[11px] tracking-[0.08em] font-semibold text-muted">Cash on Delivery</span>
              </div>
            </aside>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
