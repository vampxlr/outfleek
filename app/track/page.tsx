"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import Reveal from "@/components/store/Reveal";

const tk = (n: number) => `৳${n.toLocaleString("en-IN")}`;

const STEPS = ["pending", "confirmed", "packed", "shipped", "delivered"] as const;
const STEP_LABELS: Record<string, string> = {
  pending: "Order Placed",
  confirmed: "Confirmed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
};

export default function TrackPage() {
  const [orderNo, setOrderNo] = useState("");
  const [phone, setPhone] = useState("");
  const [submitted, setSubmitted] = useState<{ orderNo: string; phone: string } | null>(null);

  const result = useQuery(
    api.orders.track,
    submitted ? { orderNo: submitted.orderNo, phone: submitted.phone } : "skip"
  );

  const search = () => {
    const o = orderNo.trim().toUpperCase();
    const p = phone.trim();
    if (!o || !p) return;
    setSubmitted({ orderNo: o, phone: p });
  };

  const cancelled = result?.status === "cancelled" || result?.status === "returned";
  const stepIndex = result ? STEPS.indexOf(result.status as (typeof STEPS)[number]) : -1;
  const progressPct = stepIndex >= 0 ? (stepIndex / (STEPS.length - 1)) * 100 : 0;

  return (
    <div className="min-h-screen bg-cream text-ink flex flex-col">
      <Header />

      <section className="max-w-[1280px] mx-auto w-full px-5 sm:px-7 pt-14 pb-8 text-center">
        <Reveal>
          <div className="text-[11px] tracking-[0.34em] uppercase text-gold mb-3">Order Status</div>
          <h1 className="font-serif font-normal text-[clamp(32px,5vw,52px)] leading-[1.1]">
            Track your <em className="text-gold">order.</em>
          </h1>
          <div className="w-14 h-px bg-gold mx-auto mt-6" />
        </Reveal>
      </section>

      <main className="max-w-[720px] mx-auto w-full px-5 sm:px-7 pb-24 flex-1">
        <div className="border border-hairline bg-white p-6 sm:p-7">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3">
            <input
              value={orderNo}
              onChange={(e) => setOrderNo(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="ORDER NO (LX-...)"
              className="border border-hairline px-4 py-3 text-sm tracking-[0.06em] uppercase outline-none focus:border-gold bg-transparent placeholder:text-muted/60"
            />
            <input
              value={phone}
              inputMode="numeric"
              maxLength={11}
              onChange={(e) => setPhone(e.target.value.replace(/[^\d]/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="PHONE (01XXXXXXXXX)"
              className="border border-hairline px-4 py-3 text-sm tracking-[0.06em] outline-none focus:border-gold bg-transparent placeholder:text-muted/60"
            />
            <button
              onClick={search}
              className="bg-ink text-cream px-7 py-3 text-xs tracking-[0.2em] uppercase hover:bg-gold transition-colors"
            >
              Track
            </button>
          </div>
        </div>

        {submitted && result === undefined && (
          <div className="text-center text-muted text-sm py-10 tracking-[0.08em] uppercase">Searching…</div>
        )}

        {submitted && result === null && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-hairline bg-white mt-6 p-10 text-center"
          >
            <h2 className="font-serif font-normal text-2xl mb-2">Order not found</h2>
            <p className="text-muted text-sm">
              We couldn&rsquo;t find an order matching that number and phone. Please double-check and try again.
            </p>
          </motion.div>
        )}

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="border border-hairline bg-white mt-6 p-6 sm:p-8"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2 pb-5 border-b border-hairline">
              <div>
                <div className="text-[11px] tracking-[0.24em] uppercase text-gold">#{result.orderNo}</div>
                <div className="text-xs text-muted mt-1">
                  Placed {new Date(result.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                </div>
              </div>
              <div className="font-serif text-lg">{tk(result.total)}</div>
            </div>

            {cancelled ? (
              <div className="my-7 border border-red-200 bg-red-50 px-5 py-4 text-center">
                <div className="text-sm font-semibold text-red-800 uppercase tracking-[0.14em]">
                  Order {result.status}
                </div>
                <p className="text-[13px] text-red-700/80 mt-1">
                  This order has been {result.status}. Contact us if you have any questions.
                </p>
              </div>
            ) : (
              <div className="my-8">
                {/* Progress line */}
                <div className="relative mx-4">
                  <div className="absolute top-[9px] left-0 right-0 h-px bg-hairline" />
                  <motion.div
                    className="absolute top-[9px] left-0 h-px bg-gold"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPct}%` }}
                    transition={{ duration: 1, ease: [0.2, 0.8, 0.2, 1] }}
                  />
                  <div className="relative flex justify-between">
                    {STEPS.map((s, i) => {
                      const done = i <= stepIndex;
                      return (
                        <div key={s} className="flex flex-col items-center w-1/5">
                          <motion.div
                            initial={{ scale: 0.6, opacity: 0.4 }}
                            animate={{ scale: done ? 1 : 0.85, opacity: 1 }}
                            transition={{ delay: 0.15 * i }}
                            className={`w-[19px] h-[19px] rounded-full border flex items-center justify-center text-[9px] ${
                              done ? "bg-gold border-gold text-white" : "bg-white border-hairline text-transparent"
                            }`}
                          >
                            ✓
                          </motion.div>
                          <div
                            className={`mt-2.5 text-[9.5px] sm:text-[10.5px] tracking-[0.1em] uppercase text-center ${
                              done ? "text-ink" : "text-muted"
                            }`}
                          >
                            {STEP_LABELS[s]}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {result.courier && (
              <div className="border border-hairline bg-cream px-5 py-4 mb-6 text-sm">
                <span className="text-[10.5px] tracking-[0.18em] uppercase text-muted block mb-1">Courier</span>
                {result.courier.name} — Tracking ID: <b>{result.courier.trackingId}</b>
              </div>
            )}

            <div className="border-t border-hairline pt-5">
              <div className="text-[10.5px] tracking-[0.18em] uppercase text-muted mb-3">Items</div>
              {result.items.map((it, i) => (
                <div key={i} className="flex justify-between text-sm py-1.5">
                  <span>
                    {it.name} <span className="text-muted">· {it.size} × {it.qty}</span>
                  </span>
                </div>
              ))}
              <div className="flex justify-between font-serif text-base border-t border-hairline mt-3 pt-3">
                <span>Total</span>
                <span>{tk(result.total)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
