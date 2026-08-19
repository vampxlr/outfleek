"use client";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCart, cartSubtotal } from "@/lib/cart";
import ProductVisual from "./ProductVisual";

const tk = (n: number) => `৳${n.toLocaleString("en-IN")}`;

export default function CartDrawer() {
  const { items, drawerOpen, setDrawer, setQty, remove } = useCart();
  const settings = useQuery(api.settings.publicSettings, {});
  const threshold = Number(settings?.freeDeliveryThreshold ?? 2000);
  const subtotal = cartSubtotal(items);

  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          <motion.div
            key="backdrop"
            className="fixed inset-0 z-[80] bg-ink/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setDrawer(false)}
          />
          <motion.aside
            key="drawer"
            aria-label="Shopping cart"
            className="fixed right-0 top-0 z-[90] flex h-full w-[min(400px,92vw)] flex-col bg-cream shadow-[-20px_0_60px_rgba(25,24,23,.15)]"
            initial={{ x: "105%" }}
            animate={{ x: 0 }}
            exit={{ x: "105%" }}
            transition={{ type: "tween", duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className="flex items-center justify-between border-b border-hairline px-6 py-5">
              <h3 className="font-serif text-lg tracking-[.08em]">Your Cart</h3>
              <button
                aria-label="Close"
                onClick={() => setDrawer(false)}
                className="text-2xl leading-none text-muted hover:text-ink"
              >
                ×
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-2">
              {items.length === 0 ? (
                <div className="px-5 py-16 text-center text-[13px] tracking-[.06em] text-muted">
                  <span className="mb-3 block text-3xl opacity-50">🧺</span>
                  Your cart is empty.
                  <br />
                  Beautiful basics await.
                </div>
              ) : (
                items.map((it) => (
                  <div
                    key={`${it.productId}-${it.size}`}
                    className="flex gap-4 border-b border-hairline py-4"
                  >
                    <div className="h-[72px] w-[58px] flex-none overflow-hidden">
                      <ProductVisual
                        image={it.image}
                        hue={it.placeholderHue}
                        name={it.name}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-serif text-[15px]">{it.name}</div>
                      <div className="mt-0.5 text-xs text-muted">
                        Size {it.size}
                        {it.color ? ` · ${it.color}` : ""}
                      </div>
                      <div className="mt-1 text-[13px] tracking-[.04em]">
                        {tk(it.price * it.qty)}
                      </div>
                      <div className="mt-2 inline-flex items-center border border-hairline">
                        <button
                          aria-label="Decrease quantity"
                          className="h-[26px] w-[26px] text-sm text-muted hover:text-ink"
                          onClick={() => setQty(it.productId, it.size, it.qty - 1)}
                        >
                          −
                        </button>
                        <span className="w-[26px] text-center text-xs">{it.qty}</span>
                        <button
                          aria-label="Increase quantity"
                          className="h-[26px] w-[26px] text-sm text-muted hover:text-ink"
                          onClick={() => setQty(it.productId, it.size, it.qty + 1)}
                        >
                          +
                        </button>
                      </div>
                    </div>
                    <button
                      className="self-start pt-0.5 text-[10.5px] uppercase tracking-[.14em] text-muted transition-colors hover:text-red-700"
                      onClick={() => remove(it.productId, it.size)}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-hairline bg-[#f3f1ec] px-6 pb-6 pt-5">
              <div className="mb-1.5 flex justify-between text-[13px] tracking-[.06em] text-muted">
                <span>Subtotal</span>
                <span>{tk(subtotal)}</span>
              </div>
              <div className="mb-4 text-center text-[11px] uppercase tracking-[.1em] text-muted">
                {subtotal >= threshold
                  ? "You've unlocked free delivery"
                  : `Add ${tk(Math.max(0, threshold - subtotal))} more for free delivery`}
              </div>
              <Link
                href="/cart"
                onClick={() => setDrawer(false)}
                className="mb-2.5 block w-full border border-ink py-3 text-center text-xs uppercase tracking-[.22em] transition-colors hover:border-gold hover:text-gold"
              >
                View Cart
              </Link>
              <Link
                href="/checkout"
                onClick={() => setDrawer(false)}
                className="block w-full bg-ink py-3.5 text-center text-xs uppercase tracking-[.22em] text-cream transition-colors hover:bg-gold"
              >
                Checkout
              </Link>
              <div className="mt-3 text-center text-[10.5px] uppercase tracking-[.1em] text-muted">
                bKash · Nagad · Cash on Delivery
              </div>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
