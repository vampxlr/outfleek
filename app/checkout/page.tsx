"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AnimatePresence, motion } from "framer-motion";
import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import ProductVisual from "@/components/store/ProductVisual";
import Reveal from "@/components/store/Reveal";
import { useCart, cartSubtotal } from "@/lib/cart";
import { firePixel, getTrackingContext, uuid } from "@/lib/tracking";

const tk = (n: number) => `৳${n.toLocaleString("en-IN")}`;
const PHONE_RE = /^01[3-9]\d{8}$/;

type Method = "cod" | "bkash";

export default function CheckoutPage() {
  const { items, clear } = useCart();
  const settings = useQuery(api.settings.publicSettings, {}) as
    | Record<string, any>
    | undefined;
  const mirror = useMutation(api.capiHelpers.mirrorEvent);
  const saveAbandoned = useMutation(api.orders.saveAbandoned);
  const placeOrder = useMutation(api.orders.place);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [address, setAddress] = useState("");
  const [area, setArea] = useState<"dhaka" | "outside">("dhaka");
  const [notes, setNotes] = useState("");
  const [method, setMethod] = useState<Method>("cod");
  const [bkashNumber, setBkashNumber] = useState("");
  const [bkashTrxId, setBkashTrxId] = useState("");
  const [promo, setPromo] = useState<{ code: string; discount: number } | null>(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{ orderNo: string; total: number; method: Method } | null>(null);

  const subtotal = cartSubtotal(items);
  const threshold = Number(settings?.freeDeliveryThreshold ?? 2000);
  const feeDhaka = Number(settings?.deliveryFeeDhaka ?? 80);
  const feeOutside = Number(settings?.deliveryFeeOutside ?? 130);
  const freeDelivery = subtotal >= threshold;
  const deliveryFee = freeDelivery ? 0 : area === "dhaka" ? feeDhaka : feeOutside;
  const discount = promo ? Math.min(promo.discount, subtotal) : 0;
  const total = Math.max(0, subtotal - discount) + deliveryFee;

  const phoneValid = PHONE_RE.test(phone);

  // Promo from cart page
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("promo");
      if (raw) {
        const p = JSON.parse(raw);
        if (p && p.code) setPromo(p);
      }
    } catch {}
  }, []);

  // InitiateCheckout once on mount (when cart present)
  const initiated = useRef(false);
  useEffect(() => {
    if (initiated.current || items.length === 0) return;
    initiated.current = true;
    const payload = firePixel("InitiateCheckout", {
      value: subtotal,
      currency: "BDT",
      num_items: items.reduce((s, i) => s + i.qty, 0),
    });
    mirror({
      eventName: "InitiateCheckout",
      eventId: payload.eventId,
      customData: payload.customData,
      fbc: payload.fbc,
      fbp: payload.fbp,
      userAgent: payload.userAgent,
      sourceUrl: payload.sourceUrl,
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  // AddPaymentInfo when method chosen
  const paymentFired = useRef(false);
  const choosePayment = (m: Method) => {
    setMethod(m);
    if (!paymentFired.current) {
      paymentFired.current = true;
      const payload = firePixel("AddPaymentInfo", { value: total, currency: "BDT" });
      mirror({
        eventName: "AddPaymentInfo",
        eventId: payload.eventId,
        customData: payload.customData,
        fbc: payload.fbc,
        fbp: payload.fbp,
        userAgent: payload.userAgent,
        sourceUrl: payload.sourceUrl,
      }).catch(() => {});
    }
  };

  // Debounced abandoned checkout capture once phone is valid
  useEffect(() => {
    if (!phoneValid || items.length === 0 || success) return;
    const t = setTimeout(() => {
      saveAbandoned({
        name: name || undefined,
        phone,
        address: address || undefined,
        items: items.map((i) => ({ name: i.name, qty: i.qty, size: i.size, price: i.price })),
        total,
      }).catch(() => {});
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phoneValid, phone, name, address, total, items]);

  const submit = async () => {
    setError(null);
    if (!name.trim()) return setError("Please enter your full name.");
    if (!phoneValid) {
      setPhoneTouched(true);
      return setError("Please enter a valid Bangladeshi phone number (e.g. 017XXXXXXXX).");
    }
    if (!address.trim()) return setError("Please enter your delivery address.");
    if (method === "bkash" && (!bkashNumber.trim() || !bkashTrxId.trim()))
      return setError("Please enter your bKash number and Transaction ID.");

    setPlacing(true);
    const eventId = uuid();
    try {
      const res = await placeOrder({
        customer: {
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
          area,
          notes: notes.trim() ? notes.trim() : undefined,
        },
        items: items.map((i) => ({
          productId: i.productId as any,
          qty: i.qty,
          size: i.size,
          color: i.color,
        })),
        payment: {
          method,
          bkashNumber: method === "bkash" ? bkashNumber.trim() : undefined,
          bkashTrxId: method === "bkash" ? bkashTrxId.trim() : undefined,
        },
        promoCode: promo?.code,
        tracking: { eventId, ...getTrackingContext() },
      });
      // Browser Purchase pixel with the SAME eventId (server sends CAPI side)
      window.fbq?.(
        "track",
        "Purchase",
        { value: res.total, currency: "BDT" },
        { eventID: eventId }
      );
      clear();
      try {
        sessionStorage.removeItem("promo");
      } catch {}
      setSuccess({ orderNo: res.orderNo, total: res.total, method });
    } catch (e: any) {
      const msg = String(e?.message ?? e ?? "Something went wrong");
      setError(msg.replace(/^.*Uncaught Error:\s*/, "").replace(/\s+at .*$/s, ""));
    } finally {
      setPlacing(false);
    }
  };

  const inputCls =
    "w-full border border-hairline bg-white px-4 py-3 text-sm outline-none focus:border-gold transition-colors placeholder:text-muted/60";
  const labelCls = "block text-[10.5px] tracking-[0.18em] uppercase text-muted mb-2";

  if (items.length === 0 && !success) {
    return (
      <div className="min-h-screen bg-cream text-ink flex flex-col">
        <Header />
        <div className="max-w-[560px] mx-auto px-7 py-24 text-center flex-1">
          <span className="block text-4xl opacity-50 mb-5">👜</span>
          <h2 className="font-serif font-normal text-[28px] mb-3">Your cart is empty</h2>
          <p className="text-muted text-sm mb-8">Add something you love before checking out.</p>
          <Link
            href="/"
            className="inline-block bg-ink text-cream px-10 py-4 text-xs tracking-[0.22em] uppercase hover:bg-gold transition-colors"
          >
            Back to Shop
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream text-ink flex flex-col">
      <Header />

      <section className="max-w-[1280px] mx-auto w-full px-5 sm:px-7 pt-14 pb-8 text-center">
        <Reveal>
          <div className="text-[11px] tracking-[0.34em] uppercase text-gold mb-3">Secure Checkout</div>
          <h1 className="font-serif font-normal text-[clamp(32px,5vw,52px)] leading-[1.1]">
            Almost <em className="text-gold">yours.</em>
          </h1>
          <div className="w-14 h-px bg-gold mx-auto mt-6" />
        </Reveal>
      </section>

      <main className="max-w-[1100px] mx-auto w-full px-5 sm:px-7 pb-24 grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-start flex-1">
        {/* Form */}
        <div className="space-y-8">
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="border border-red-300 bg-red-50 text-red-800 text-sm px-4 py-3"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <section className="border border-hairline bg-white p-6 sm:p-7">
            <h3 className="font-serif font-normal text-xl tracking-[0.04em] mb-5 pb-4 border-b border-hairline">
              <span className="text-gold mr-2">01</span> Delivery Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Full Name *</label>
                <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div>
                <label className={labelCls}>Phone Number *</label>
                <input
                  className={`${inputCls} ${phoneTouched && !phoneValid ? "border-red-400" : ""}`}
                  value={phone}
                  inputMode="numeric"
                  onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))}
                  onBlur={() => setPhoneTouched(true)}
                  placeholder="01XXXXXXXXX"
                  maxLength={11}
                />
                {phoneTouched && !phoneValid && phone.length > 0 && (
                  <div className="text-[11.5px] text-red-700 mt-1.5 tracking-[0.04em]">
                    Enter a valid 11-digit number starting with 013–019.
                  </div>
                )}
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Full Address *</label>
                <textarea
                  className={`${inputCls} min-h-[88px] resize-y`}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House, road, area, district"
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Delivery Area *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(
                    [
                      ["dhaka", "Inside Dhaka", feeDhaka],
                      ["outside", "Outside Dhaka", feeOutside],
                    ] as const
                  ).map(([key, label, fee]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setArea(key)}
                      className={`border px-4 py-3.5 text-left transition-colors ${
                        area === key ? "border-ink bg-ink text-cream" : "border-hairline hover:border-ink"
                      }`}
                    >
                      <div className="text-xs tracking-[0.14em] uppercase">{label}</div>
                      <div className={`text-[11px] mt-1 ${area === key ? "text-cream/70" : "text-muted"}`}>
                        {freeDelivery ? "Free delivery" : `Delivery ${tk(fee)}`}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Order Notes (optional)</label>
                <textarea
                  className={`${inputCls} min-h-[60px] resize-y`}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Anything we should know?"
                />
              </div>
            </div>
          </section>

          <section className="border border-hairline bg-white p-6 sm:p-7">
            <h3 className="font-serif font-normal text-xl tracking-[0.04em] mb-5 pb-4 border-b border-hairline">
              <span className="text-gold mr-2">02</span> Payment Method
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => choosePayment("cod")}
                className={`border p-4 text-left transition-colors ${
                  method === "cod" ? "border-ink bg-ink text-cream" : "border-hairline hover:border-ink"
                }`}
              >
                <div className="text-xs tracking-[0.16em] uppercase font-semibold">Cash on Delivery</div>
                <div className={`text-[12px] mt-1.5 ${method === "cod" ? "text-cream/70" : "text-muted"}`}>
                  Pay when your order arrives at your door.
                </div>
              </button>
              <button
                type="button"
                onClick={() => choosePayment("bkash")}
                className={`border p-4 text-left transition-colors ${
                  method === "bkash"
                    ? "border-bkash bg-bkash text-white"
                    : "border-hairline hover:border-bkash"
                }`}
              >
                <div className="text-xs tracking-[0.16em] uppercase font-semibold">
                  bKash <span className="normal-case tracking-normal font-normal">(Send Money)</span>
                </div>
                <div className={`text-[12px] mt-1.5 ${method === "bkash" ? "text-white/80" : "text-muted"}`}>
                  Pay now via bKash and confirm with TrxID.
                </div>
              </button>
            </div>

            <AnimatePresence>
              {method === "bkash" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="mt-4 border border-bkash/30 bg-bkash/5 p-4 sm:p-5">
                    <div className="text-sm font-semibold text-bkash mb-1.5">
                      bKash Number: {String(settings?.bkashNumber ?? "")}
                    </div>
                    <p className="text-[13px] text-muted mb-4">
                      {String(settings?.bkashInstructions ?? "")}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Your bKash Number *</label>
                        <input
                          className={inputCls}
                          value={bkashNumber}
                          inputMode="numeric"
                          onChange={(e) => setBkashNumber(e.target.value.replace(/[^\d]/g, ""))}
                          placeholder="01XXXXXXXXX"
                          maxLength={11}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Transaction ID (TrxID) *</label>
                        <input
                          className={inputCls}
                          value={bkashTrxId}
                          onChange={(e) => setBkashTrxId(e.target.value.toUpperCase())}
                          placeholder="e.g. 9H7XXXXXXX"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          <button
            onClick={submit}
            disabled={placing}
            className="w-full bg-ink text-cream px-6 py-4 text-xs tracking-[0.24em] uppercase hover:bg-gold transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {placing ? "Placing Order…" : `Place Order — ${tk(total)}`}
          </button>
        </div>

        {/* Summary */}
        <aside className="lg:sticky lg:top-24 border border-hairline bg-white p-7 order-first lg:order-none">
          <h3 className="font-serif font-normal text-xl tracking-[0.06em] mb-5 pb-4 border-b border-hairline">
            Your Order
          </h3>
          <div className="space-y-4 mb-5">
            {items.map((it) => (
              <div key={`${it.productId}-${it.size}`} className="flex gap-3 items-center">
                <div className="w-12 h-14 border border-hairline flex items-center justify-center overflow-hidden shrink-0">
                  <ProductVisual image={it.image} hue={it.placeholderHue} name={it.name} className="w-full h-full" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-serif text-[14px] truncate">{it.name}</div>
                  <div className="text-[11px] text-muted uppercase tracking-[0.08em]">
                    {it.size}
                    {it.color ? ` · ${it.color}` : ""} × {it.qty}
                  </div>
                </div>
                <div className="text-[13px]">{tk(it.price * it.qty)}</div>
              </div>
            ))}
          </div>
          <div className="border-t border-hairline pt-4 space-y-2.5 text-[13px] tracking-[0.06em] text-muted">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="text-ink">{tk(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-gold">
                <span>Discount ({promo?.code})</span>
                <span>−{tk(discount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Delivery ({area === "dhaka" ? "Inside Dhaka" : "Outside Dhaka"})</span>
              <motion.span key={deliveryFee} initial={{ scale: 1.15, color: "#b8975a" }} animate={{ scale: 1, color: "#1a1a1a" }}>
                {deliveryFee === 0 ? "Free" : tk(deliveryFee)}
              </motion.span>
            </div>
            <div className="flex justify-between font-serif text-lg text-ink border-t border-hairline pt-3.5 mt-1">
              <span>Total</span>
              <motion.span key={total} initial={{ scale: 1.12, color: "#b8975a" }} animate={{ scale: 1, color: "#1a1a1a" }}>
                {tk(total)}
              </motion.span>
            </div>
          </div>
        </aside>
      </main>

      <Footer />

      {/* Success overlay */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[200] bg-cream/[0.98] flex items-center justify-center"
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
              className="text-center max-w-[480px] px-7 py-10"
            >
              <svg className="w-24 h-24 mx-auto mb-6" viewBox="0 0 100 100">
                <motion.circle
                  cx="50"
                  cy="50"
                  r="48"
                  fill="none"
                  stroke="#b8975a"
                  strokeWidth="1.5"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                />
                <motion.path
                  d="M30 52 L44 66 L72 36"
                  fill="none"
                  stroke="#1a1a1a"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.6, delay: 0.9, ease: "easeOut" }}
                />
              </svg>
              <h2 className="font-serif font-normal text-[clamp(30px,5vw,42px)] mb-3">
                Order <em className="text-gold">Confirmed!</em>
              </h2>
              <div className="text-xs tracking-[0.26em] uppercase text-gold mb-4">#{success.orderNo}</div>
              <p className="text-muted text-sm mb-1.5">
                Payment: {success.method === "cod" ? "Cash on Delivery" : "bKash (pending verification)"}
              </p>
              <p className="text-muted text-sm mb-1.5">Total: {tk(success.total)}</p>
              <p className="text-muted text-sm">
                We&rsquo;ll call you shortly to confirm your order. Thank you!
              </p>
              <div className="w-14 h-px bg-gold mx-auto my-5" />
              <Link
                href="/"
                className="inline-block bg-ink text-cream px-10 py-4 text-xs tracking-[0.22em] uppercase hover:bg-gold transition-colors"
              >
                Continue Shopping
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
