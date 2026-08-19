"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/convex/_generated/api";
import {
  captureClickIds,
  firePixel,
  getTrackingContext,
  initPixel,
  uuid,
} from "@/lib/tracking";

/* ---------------------------------- types --------------------------------- */

type Variant = { size: string; color: string; stock: number };
type Section = { type: string; enabled: boolean; content: any };

const tk = (n: number) => `৳${n.toLocaleString("en-US")}`;

/* ------------------------------ tee placeholder ---------------------------- */

function TeePlaceholder({ hue, className }: { hue?: number; className?: string }) {
  const h = hue ?? 38;
  return (
    <div
      className={`flex items-center justify-center ${className ?? ""}`}
      style={{
        background: `linear-gradient(160deg, hsl(${h},32%,92%), hsl(${h},28%,82%))`,
      }}
    >
      <svg viewBox="0 0 120 120" className="w-1/2 h-auto opacity-90" style={{ filter: "drop-shadow(0 10px 18px rgba(0,0,0,.10))" }}>
        <path
          d="M40 18 L20 30 L10 52 L26 60 L30 50 L30 104 L90 104 L90 50 L94 60 L110 52 L100 30 L80 18 C76 26 68 30 60 30 C52 30 44 26 40 18 Z"
          fill={`hsl(${h},30%,45%)`}
          stroke={`hsl(${h},30%,30%)`}
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

/* --------------------------------- reveal --------------------------------- */

function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}

const scrollToOrder = () =>
  document.getElementById("order")?.scrollIntoView({ behavior: "smooth" });

/* ---------------------------------- hero ----------------------------------- */

function Hero({ content, price }: { content: any; price: number }) {
  return (
    <section className="hairline-b px-6 pt-16 pb-14 text-center sm:pt-24 sm:pb-20">
      <div className="mx-auto max-w-2xl">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="mb-5 text-[11px] uppercase tracking-[0.34em] text-gold"
        >
          Limited Release
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className="serif text-[clamp(34px,7vw,64px)] font-normal leading-[1.08]"
        >
          {content?.headline ?? "Timeless Style"}
        </motion.h1>
        {content?.subheadline && (
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="mx-auto mt-5 max-w-lg text-[15px] text-muted"
          >
            {content.subheadline}
          </motion.p>
        )}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="mt-9"
        >
          <button
            onClick={scrollToOrder}
            className="bg-ink px-10 py-4 text-[12px] uppercase tracking-[0.22em] text-cream transition-colors hover:bg-gold"
          >
            {content?.ctaText ?? `Order Now — ${tk(price)}`}
          </button>
          <div className="mx-auto mt-9 h-px w-14 bg-gold" />
        </motion.div>
      </div>
    </section>
  );
}

/* -------------------------------- benefits --------------------------------- */

function Benefits({ content }: { content: any }) {
  const items: string[] = content?.items ?? [];
  if (!items.length) return null;
  return (
    <section className="hairline-b px-6 py-14">
      <div className="mx-auto max-w-xl">
        <ul className="space-y-4">
          {items.map((b, i) => (
            <motion.li
              key={i}
              initial={{ opacity: 0, x: -18 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex items-start gap-3 text-[15px]"
            >
              <svg viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 flex-none" fill="none" stroke="#b8975a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="10" cy="10" r="9" strokeWidth="1" />
                <path d="M6 10.5l2.5 2.5L14 7.5" />
              </svg>
              <span>{b}</span>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* --------------------------------- gallery --------------------------------- */

function Gallery({ product }: { product: any }) {
  const images: string[] = product.images ?? [];
  const [active, setActive] = useState(0);
  return (
    <section className="hairline-b px-6 py-14">
      <div className="mx-auto max-w-md">
        <Reveal>
          <div className="hairline aspect-[4/5] overflow-hidden bg-white">
            <AnimatePresence mode="wait">
              {images.length ? (
                <motion.img
                  key={active}
                  src={images[active]}
                  alt={product.name}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35 }}
                  className="h-full w-full object-cover"
                />
              ) : (
                <TeePlaceholder hue={product.placeholderHue} className="h-full w-full" />
              )}
            </AnimatePresence>
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2">
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  className={`aspect-[4/5] w-16 overflow-hidden border transition-opacity ${
                    i === active ? "border-gold" : "border-hairline opacity-70 hover:opacity-100"
                  }`}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}

/* --------------------------------- reviews --------------------------------- */

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5 text-gold" aria-label={`${n} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 20 20" className="h-4 w-4" fill={i <= n ? "#b8975a" : "none"} stroke="#b8975a" strokeWidth="1">
          <path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L10 14.9l-5.2 2.7 1-5.8L1.5 7.7l5.9-.8L10 1.5z" />
        </svg>
      ))}
    </div>
  );
}

function Reviews({ content }: { content: any }) {
  const items: { name: string; text: string; stars: number }[] = content?.items ?? [];
  if (!items.length) return null;
  return (
    <section className="hairline-b bg-white/50 px-6 py-14">
      <div className="mx-auto max-w-2xl">
        <Reveal>
          <h2 className="serif mb-8 text-center text-2xl font-normal">What Customers Say</h2>
        </Reveal>
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.55, delay: i * 0.12 }}
              className="hairline bg-cream p-5"
            >
              <Stars n={r.stars} />
              <p className="mt-3 text-[14px] leading-relaxed text-charcoal">“{r.text}”</p>
              <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-muted">— {r.name}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------------------------- offer ---------------------------------- */

function Countdown({ minutes }: { minutes: number }) {
  const [left, setLeft] = useState(Math.max(1, minutes) * 60);
  useEffect(() => {
    const t = setInterval(() => setLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, []);
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return (
    <div className="mt-5 flex items-center justify-center gap-2 text-[13px] uppercase tracking-[0.18em] text-charcoal">
      <span>Offer ends in</span>
      <motion.span
        key={left}
        initial={{ opacity: 0.4, y: -3 }}
        animate={{ opacity: 1, y: 0 }}
        className="serif inline-block min-w-[64px] text-xl tracking-widest text-ink"
      >
        {mm}:{ss}
      </motion.span>
    </div>
  );
}

function Offer({ content, product }: { content: any; product: any }) {
  return (
    <section className="hairline-b px-6 py-14 text-center">
      <Reveal>
        <p className="text-[11px] uppercase tracking-[0.3em] text-gold">Special Offer</p>
        <div className="mt-4 flex items-baseline justify-center gap-3">
          <span className="serif text-4xl">{tk(product.price)}</span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-lg text-muted line-through">{tk(product.compareAtPrice)}</span>
          )}
        </div>
        {content?.showCountdown && <Countdown minutes={content?.countdownMinutes ?? 15} />}
        {content?.showStock && (
          <div className="mt-4 flex items-center justify-center gap-2 text-[13px] text-charcoal">
            <motion.span
              className="inline-block h-2 w-2 rounded-full bg-bkash"
              animate={{ opacity: [1, 0.3, 1], scale: [1, 0.85, 1] }}
              transition={{ duration: 1.4, repeat: Infinity }}
            />
            {content?.stockText ?? "Only a few left in stock"}
          </div>
        )}
      </Reveal>
    </section>
  );
}

/* -------------------------------- size chart ------------------------------- */

function SizeChart({ content }: { content: any }) {
  const rows: { size: string; chest: string; length: string }[] = content?.rows ?? [];
  if (!rows.length) return null;
  return (
    <section className="hairline-b px-6 py-14">
      <div className="mx-auto max-w-md">
        <Reveal>
          <h2 className="serif mb-6 text-center text-2xl font-normal">Size Guide</h2>
          <table className="hairline w-full border-collapse text-center text-[14px]">
            <thead>
              <tr className="hairline-b bg-white/60 text-[11px] uppercase tracking-[0.18em] text-muted">
                <th className="py-3 font-medium">Size</th>
                <th className="py-3 font-medium">Chest</th>
                <th className="py-3 font-medium">Length</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="hairline-b last:border-b-0">
                  <td className="serif py-3">{r.size}</td>
                  <td className="py-3 text-charcoal">{r.chest}</td>
                  <td className="py-3 text-charcoal">{r.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
      </div>
    </section>
  );
}

/* ----------------------------------- faq ----------------------------------- */

function Faq({ content }: { content: any }) {
  const items: { q: string; a: string }[] = content?.items ?? [];
  const [open, setOpen] = useState<number | null>(null);
  if (!items.length) return null;
  return (
    <section className="hairline-b px-6 py-14">
      <div className="mx-auto max-w-xl">
        <Reveal>
          <h2 className="serif mb-6 text-center text-2xl font-normal">Questions & Answers</h2>
        </Reveal>
        <div className="hairline divide-y divide-hairline bg-white/40">
          {items.map((f, i) => (
            <div key={i}>
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-[14px] font-medium"
              >
                {f.q}
                <motion.span animate={{ rotate: open === i ? 45 : 0 }} className="text-lg text-gold">
                  +
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <p className="px-5 pb-5 text-[14px] leading-relaxed text-muted">{f.a}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------- order form ------------------------------- */

function OrderForm({
  content,
  product,
  slug,
  deliveryFeeOverride,
  settings,
  onFirstFocus,
  onSuccess,
}: {
  content: any;
  product: any;
  slug: string;
  deliveryFeeOverride?: number;
  settings: any;
  onFirstFocus: () => void;
  onSuccess: (r: { orderNo: string; total: number }) => void;
}) {
  const place = useMutation(api.orders.place);
  const variants: Variant[] = product.variants ?? [];
  const sizes = useMemo(() => {
    const map = new Map<string, number>();
    for (const v of variants) map.set(v.size, (map.get(v.size) ?? 0) + v.stock);
    return Array.from(map.entries()).map(([size, stock]) => ({ size, stock }));
  }, [variants]);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [area, setArea] = useState<"dhaka" | "outside">("dhaka");
  const [size, setSize] = useState<string>(sizes.find((s) => s.stock > 0)?.size ?? "");
  const [qty, setQty] = useState(1);
  const [method, setMethod] = useState<"cod" | "bkash">("cod");
  const [bkashNumber, setBkashNumber] = useState("");
  const [bkashTrxId, setBkashTrxId] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const feeDhaka = Number(settings?.deliveryFeeDhaka ?? 80);
  const feeOutside = Number(settings?.deliveryFeeOutside ?? 130);
  const threshold = Number(settings?.freeDeliveryThreshold ?? 2000);

  const subtotal = product.price * qty;
  let deliveryFee = deliveryFeeOverride ?? (area === "dhaka" ? feeDhaka : feeOutside);
  if (subtotal >= threshold) deliveryFee = 0;
  const total = subtotal + deliveryFee;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Please enter your name";
    if (!/^01[3-9]\d{8}$/.test(phone.trim())) e.phone = "Enter a valid 11-digit number (01XXXXXXXXX)";
    if (!address.trim()) e.address = "Please enter your full delivery address";
    if (!size) e.size = "Please select a size";
    if (method === "bkash") {
      if (!bkashNumber.trim()) e.bkashNumber = "Enter the bKash number you sent from";
      if (!bkashTrxId.trim()) e.bkashTrxId = "Enter the bKash Transaction ID";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    setServerError("");
    if (!validate()) return;
    setSubmitting(true);
    const eventId = uuid();
    const color = variants.find((v) => v.size === size && v.stock >= qty)?.color;
    try {
      const result = await place({
        customer: { name: name.trim(), phone: phone.trim(), address: address.trim(), area },
        items: [{ productId: product._id, qty, size, color }],
        payment: {
          method,
          bkashNumber: method === "bkash" ? bkashNumber.trim() : undefined,
          bkashTrxId: method === "bkash" ? bkashTrxId.trim() : undefined,
        },
        landingSlug: slug,
        tracking: { eventId, ...getTrackingContext() },
      });
      window.fbq?.(
        "track",
        "Purchase",
        { value: result.total, currency: "BDT" },
        { eventID: eventId }
      );
      onSuccess({ orderNo: result.orderNo, total: result.total });
    } catch (err: any) {
      setServerError(
        (err?.message ?? "Something went wrong. Please try again.").replace(/^.*Uncaught Error:\s*/, "").split("\n")[0]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const field =
    "w-full border border-hairline bg-white px-4 py-3 text-[15px] outline-none transition-colors focus:border-gold";
  const label = "mb-1.5 block text-[11px] uppercase tracking-[0.18em] text-muted";
  const errText = "mt-1 text-[12px] text-bkash";

  return (
    <section id="order" className="px-6 py-14" onFocusCapture={onFirstFocus}>
      <div className="mx-auto max-w-md">
        <Reveal>
          <h2 className="serif mb-2 text-center text-2xl font-normal">Place Your Order</h2>
          <p className="mb-8 text-center text-[13px] text-muted">
            Fill in the form below — pay cash on delivery or bKash.
          </p>
        </Reveal>

        <Reveal className="hairline space-y-5 bg-white p-6">
          <div>
            <label className={label}>Your Name</label>
            <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
            {errors.name && <p className={errText}>{errors.name}</p>}
          </div>
          <div>
            <label className={label}>Phone Number</label>
            <input
              className={field}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="01XXXXXXXXX"
              inputMode="numeric"
              maxLength={11}
            />
            {errors.phone && <p className={errText}>{errors.phone}</p>}
          </div>
          <div>
            <label className={label}>Delivery Address</label>
            <textarea
              className={`${field} resize-none`}
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="House, road, area, district"
            />
            {errors.address && <p className={errText}>{errors.address}</p>}
          </div>

          <div>
            <label className={label}>Delivery Area</label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["dhaka", "Inside Dhaka", deliveryFeeOverride ?? feeDhaka],
                  ["outside", "Outside Dhaka", deliveryFeeOverride ?? feeOutside],
                ] as const
              ).map(([val, text, fee]) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setArea(val)}
                  className={`border px-3 py-3 text-[13px] transition-colors ${
                    area === val ? "border-ink bg-ink text-cream" : "border-hairline bg-white hover:border-ink"
                  }`}
                >
                  {text}
                  <span className={`block text-[11px] ${area === val ? "text-cream/70" : "text-muted"}`}>
                    Delivery {tk(fee)}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={label}>Size</label>
            <div className="flex flex-wrap gap-2">
              {sizes.map((s) => (
                <button
                  key={s.size}
                  type="button"
                  disabled={s.stock <= 0}
                  onClick={() => setSize(s.size)}
                  className={`min-w-[52px] border px-4 py-2.5 text-[13px] tracking-wide transition-colors ${
                    s.stock <= 0
                      ? "cursor-not-allowed border-hairline text-muted line-through opacity-50"
                      : size === s.size
                        ? "border-ink bg-ink text-cream"
                        : "border-hairline bg-white hover:border-ink"
                  }`}
                >
                  {s.size}
                </button>
              ))}
            </div>
            {errors.size && <p className={errText}>{errors.size}</p>}
          </div>

          <div>
            <label className={label}>Quantity</label>
            <div className="inline-flex items-center border border-hairline bg-white">
              <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="px-4 py-2.5 text-lg text-charcoal hover:text-gold">
                −
              </button>
              <span className="serif min-w-[44px] text-center text-[16px]">{qty}</span>
              <button type="button" onClick={() => setQty((q) => Math.min(10, q + 1))} className="px-4 py-2.5 text-lg text-charcoal hover:text-gold">
                +
              </button>
            </div>
          </div>

          <div>
            <label className={label}>Payment Method</label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setMethod("cod")}
                className={`w-full border px-4 py-3.5 text-left transition-colors ${
                  method === "cod" ? "border-ink" : "border-hairline hover:border-ink"
                }`}
              >
                <span className="text-[14px] font-medium">Cash on Delivery</span>
                <span className="block text-[12px] text-muted">Pay when you receive the product</span>
              </button>
              <button
                type="button"
                onClick={() => setMethod("bkash")}
                className={`w-full border px-4 py-3.5 text-left transition-colors ${
                  method === "bkash" ? "border-bkash" : "border-hairline hover:border-bkash"
                }`}
              >
                <span className="text-[14px] font-medium text-bkash">bKash</span>
                <span className="block text-[12px] text-muted">Send Money & confirm with TrxID</span>
              </button>
              <AnimatePresence initial={false}>
                {method === "bkash" && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 border border-bkash/30 bg-bkash/5 p-4">
                      <p className="text-[13px]">
                        bKash number:{" "}
                        <span className="font-semibold text-bkash">{String(settings?.bkashNumber ?? "")}</span>
                      </p>
                      <p className="text-[12px] leading-relaxed text-muted">
                        {String(settings?.bkashInstructions ?? "")}
                      </p>
                      <div>
                        <input
                          className={field}
                          value={bkashNumber}
                          onChange={(e) => setBkashNumber(e.target.value)}
                          placeholder="Your bKash number"
                          inputMode="numeric"
                        />
                        {errors.bkashNumber && <p className={errText}>{errors.bkashNumber}</p>}
                      </div>
                      <div>
                        <input
                          className={field}
                          value={bkashTrxId}
                          onChange={(e) => setBkashTrxId(e.target.value)}
                          placeholder="Transaction ID (TrxID)"
                        />
                        {errors.bkashTrxId && <p className={errText}>{errors.bkashTrxId}</p>}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="hairline-t space-y-1.5 pt-4 text-[14px]">
            <div className="flex justify-between text-muted">
              <span>
                {product.name} × {qty}
              </span>
              <span>{tk(subtotal)}</span>
            </div>
            <div className="flex justify-between text-muted">
              <span>Delivery</span>
              <span>{deliveryFee === 0 ? "Free" : tk(deliveryFee)}</span>
            </div>
            <div className="serif flex justify-between pt-1 text-[18px]">
              <span>Total</span>
              <span>{tk(total)}</span>
            </div>
          </div>

          {serverError && (
            <p className="border border-bkash/40 bg-bkash/5 px-4 py-3 text-[13px] text-bkash">{serverError}</p>
          )}

          <button
            type="button"
            disabled={submitting}
            onClick={submit}
            className="w-full bg-ink py-4 text-[13px] uppercase tracking-[0.22em] text-cream transition-colors hover:bg-gold disabled:opacity-60"
          >
            {submitting ? "Placing Order…" : (content?.buttonText ?? `Confirm Order — ${tk(total)}`)}
          </button>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------ success overlay ---------------------------- */

function SuccessOverlay({ orderNo, total }: { orderNo: string; total: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 px-6"
    >
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
        className="w-full max-w-sm bg-cream px-8 py-10 text-center"
      >
        <svg viewBox="0 0 64 64" className="mx-auto h-16 w-16">
          <circle cx="32" cy="32" r="30" fill="none" stroke="#b8975a" strokeWidth="1.5" />
          <motion.path
            d="M20 33 L28.5 41.5 L45 24"
            fill="none"
            stroke="#b8975a"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
          />
        </svg>
        <h2 className="serif mt-5 text-2xl font-normal">Order Confirmed</h2>
        <p className="mt-3 text-[13px] text-muted">Your order number is</p>
        <p className="serif mt-1 text-lg tracking-widest text-gold">{orderNo}</p>
        <p className="mt-4 text-[14px] text-charcoal">
          Total payable: <span className="font-medium">{tk(total)}</span>
        </p>
        <p className="mt-3 text-[13px] leading-relaxed text-muted">
          We will call you shortly to confirm your delivery. Thank you.
        </p>
      </motion.div>
    </motion.div>
  );
}

/* --------------------------------- not found ------------------------------- */

function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-cream px-6 text-center">
      <p className="text-[11px] uppercase tracking-[0.34em] text-gold">404</p>
      <h1 className="serif mt-4 text-3xl font-normal">This page is unavailable</h1>
      <p className="mt-3 max-w-sm text-[14px] text-muted">
        The offer you are looking for may have ended or the link is incorrect.
      </p>
      <Link
        href="/"
        className="mt-8 border border-ink px-8 py-3 text-[12px] uppercase tracking-[0.22em] transition-colors hover:bg-ink hover:text-cream"
      >
        Visit the Store
      </Link>
    </main>
  );
}

/* ------------------------------- main component ---------------------------- */

export default function LandingPage({ slug }: { slug: string }) {
  const data = useQuery(api.landingPages.bySlug, { slug });
  const settings = useQuery(api.settings.publicSettings, {});
  const recordView = useMutation(api.landingPages.recordView);
  const recordInitiate = useMutation(api.landingPages.recordInitiate);
  const mirrorEvent = useMutation(api.capiHelpers.mirrorEvent);

  const [success, setSuccess] = useState<{ orderNo: string; total: number } | null>(null);
  const viewedRef = useRef(false);
  const initiatedRef = useRef(false);

  // Mount tracking: pixel init + view + ViewContent (pixel + CAPI mirror, same eventId)
  useEffect(() => {
    if (!data || !settings || viewedRef.current) return;
    viewedRef.current = true;
    captureClickIds();
    if (settings.pixelId) initPixel(String(settings.pixelId));
    recordView({ slug }).catch(() => {});
    const customData = {
      content_name: slug,
      content_ids: [String(data.product._id)],
      content_type: "product",
      value: data.product.price,
      currency: "BDT",
    };
    const ctx = firePixel("ViewContent", customData);
    mirrorEvent({
      eventName: "ViewContent",
      eventId: ctx.eventId,
      customData,
      fbc: ctx.fbc,
      fbp: ctx.fbp,
      userAgent: ctx.userAgent,
      sourceUrl: ctx.sourceUrl,
    }).catch(() => {});
  }, [data, settings, slug, recordView, mirrorEvent]);

  const onFormFocus = useCallback(() => {
    if (initiatedRef.current || !data) return;
    initiatedRef.current = true;
    recordInitiate({ slug }).catch(() => {});
    const customData = {
      content_name: slug,
      content_ids: [String(data.product._id)],
      value: data.product.price,
      currency: "BDT",
    };
    const ctx = firePixel("InitiateCheckout", customData);
    mirrorEvent({
      eventName: "InitiateCheckout",
      eventId: ctx.eventId,
      customData,
      fbc: ctx.fbc,
      fbp: ctx.fbp,
      userAgent: ctx.userAgent,
      sourceUrl: ctx.sourceUrl,
    }).catch(() => {});
  }, [data, slug, recordInitiate, mirrorEvent]);

  if (data === undefined || settings === undefined) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream">
        <motion.div
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.6, repeat: Infinity }}
          className="serif text-[13px] uppercase tracking-[0.34em] text-muted"
        >
          Loading
        </motion.div>
      </main>
    );
  }

  if (data === null) return <NotFound />;

  const { product } = data;
  const sections = (data.sections as Section[]).filter((s) => s.enabled);
  const hasOrderForm = sections.some((s) => s.type === "orderForm");

  return (
    <main className="min-h-screen bg-cream pb-20">
      {sections.map((s, i) => {
        switch (s.type) {
          case "hero":
            return <Hero key={i} content={s.content} price={product.price} />;
          case "benefits":
            return <Benefits key={i} content={s.content} />;
          case "gallery":
            return <Gallery key={i} product={product} />;
          case "reviews":
            return <Reviews key={i} content={s.content} />;
          case "offer":
            return <Offer key={i} content={s.content} product={product} />;
          case "sizeChart":
            return <SizeChart key={i} content={s.content} />;
          case "faq":
            return <Faq key={i} content={s.content} />;
          case "orderForm":
            return (
              <OrderForm
                key={i}
                content={s.content}
                product={product}
                slug={slug}
                deliveryFeeOverride={data.deliveryFeeOverride ?? undefined}
                settings={settings}
                onFirstFocus={onFormFocus}
                onSuccess={setSuccess}
              />
            );
          default:
            return null;
        }
      })}

      {/* Minimal ad-compliance footer */}
      <footer className="hairline-t px-6 py-8 text-center">
        <div className="flex items-center justify-center gap-6 text-[11px] uppercase tracking-[0.18em] text-muted">
          <Link href="/return-policy" className="transition-colors hover:text-gold">
            Return Policy
          </Link>
          <span className="text-hairline">|</span>
          <Link href="/privacy" className="transition-colors hover:text-gold">
            Privacy
          </Link>
        </div>
        <p className="mt-3 text-[11px] tracking-[0.12em] text-muted/70">
          © {new Date().getFullYear()} {String(settings?.storeName ?? "")}
        </p>
      </footer>

      {/* Sticky mobile order bar */}
      {hasOrderForm && !success && (
        <motion.div
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          transition={{ delay: 1, duration: 0.5, ease: "easeOut" }}
          className="fixed inset-x-0 bottom-0 z-50 border-t border-hairline bg-cream/95 p-3 backdrop-blur sm:hidden"
        >
          <button
            onClick={scrollToOrder}
            className="w-full bg-ink py-3.5 text-[13px] uppercase tracking-[0.22em] text-cream"
          >
            Order Now — {tk(product.price)}
          </button>
        </motion.div>
      )}

      <AnimatePresence>
        {success && <SuccessOverlay orderNo={success.orderNo} total={success.total} />}
      </AnimatePresence>
    </main>
  );
}
