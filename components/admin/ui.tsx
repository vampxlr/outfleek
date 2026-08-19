"use client";
import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function PageHead({ title, sub, actions }: { title: string; sub?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
      <div>
        <h1 className="serif text-2xl md:text-3xl text-ink">{title}</h1>
        {sub && <p className="text-sm text-muted mt-1">{sub}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`bg-white hairline rounded-sm ${className}`}>{children}</div>;
}

export function Btn({
  children, onClick, kind = "primary", type = "button", disabled, className = "",
}: {
  children: ReactNode; onClick?: () => void;
  kind?: "primary" | "ghost" | "danger"; type?: "button" | "submit";
  disabled?: boolean; className?: string;
}) {
  const styles =
    kind === "primary"
      ? "bg-ink text-cream hover:bg-charcoal"
      : kind === "danger"
        ? "text-red-700 hairline hover:bg-red-50"
        : "text-ink hairline hover:bg-cream";
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`px-4 py-2 text-sm rounded-sm transition-colors disabled:opacity-50 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="block text-xs uppercase tracking-wide text-muted mb-1">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted mt-1">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full px-3 py-2 text-sm bg-white hairline rounded-sm outline-none focus:border-gold";

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 text-sm"
    >
      <span
        className={`w-9 h-5 rounded-full transition-colors relative ${checked ? "bg-gold" : "bg-hairline"}`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${checked ? "left-4.5" : "left-0.5"}`}
          style={{ left: checked ? 18 : 2 }}
        />
      </span>
      {label && <span>{label}</span>}
    </button>
  );
}

export function Chip({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "green" | "gold" | "red" | "blue" }) {
  const tones: Record<string, string> = {
    neutral: "bg-cream text-muted",
    green: "bg-emerald-50 text-emerald-700",
    gold: "bg-amber-50 text-gold-dark",
    red: "bg-red-50 text-red-700",
    blue: "bg-blue-50 text-blue-700",
  };
  return (
    <span className={`inline-block px-2 py-0.5 text-xs rounded-full ${tones[tone]}`}>{children}</span>
  );
}

export function Modal({
  open, onClose, title, children, wide,
}: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-ink/40 p-4 overflow-y-auto"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={`bg-cream rounded-sm w-full ${wide ? "max-w-3xl" : "max-w-xl"} my-8`}
            initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 16, opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 hairline-b">
              <h2 className="serif text-lg">{title}</h2>
              <button onClick={onClose} className="text-muted hover:text-ink text-xl leading-none">&times;</button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function Drawer({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-ink/40"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="absolute right-0 top-0 h-full w-full max-w-lg bg-cream shadow-xl overflow-y-auto"
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.22 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-cream flex items-center justify-between px-5 py-4 hairline-b z-10">
              <h2 className="serif text-lg">{title}</h2>
              <button onClick={onClose} className="text-muted hover:text-ink text-xl leading-none">&times;</button>
            </div>
            <div className="p-5">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export const fmtBDT = (n: number) => `৳${n.toLocaleString("en-US")}`;
export const fmtDate = (ms: number) =>
  new Date(ms).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

export const statusTone = (s: string): "neutral" | "green" | "gold" | "red" | "blue" =>
  s === "delivered" ? "green"
  : s === "pending" ? "gold"
  : s === "cancelled" || s === "returned" ? "red"
  : s === "shipped" || s === "packed" ? "blue"
  : "neutral";
