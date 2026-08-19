"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useCart, cartCount } from "@/lib/cart";
import CartDrawer from "./CartDrawer";

export default function Header() {
  const settings = useQuery(api.settings.publicSettings, {});
  const { items, setDrawer } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const count = mounted ? cartCount(items) : 0;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const storeName = String(settings?.storeName ?? "Outfleek");
  const logoUrl = String(settings?.logoUrl ?? "");
  const announcement = String(
    settings?.announcementBar ?? "Free delivery over ৳2000 · Cash on Delivery available"
  );

  return (
    <>
      <div className="bg-ink px-4 py-2 text-center text-[11px] uppercase tracking-[.14em] text-[#d8d4cc]">
        {announcement}
      </div>
      <header
        className={`sticky top-0 z-[60] border-b border-hairline bg-cream/90 backdrop-blur-md transition-shadow duration-300 ${
          scrolled ? "shadow-[0_6px_24px_rgba(25,24,23,.08)]" : ""
        }`}
      >
        <div className="mx-auto flex h-[66px] max-w-[1280px] items-center justify-between gap-5 px-5 md:px-7">
          <button
            className="flex h-9 w-9 flex-col items-center justify-center gap-[5px] md:hidden"
            aria-label="Menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <span
              className={`block h-[1.5px] w-5 bg-ink transition-transform ${
                menuOpen ? "translate-y-[6.5px] rotate-45" : ""
              }`}
            />
            <span className={`block h-[1.5px] w-5 bg-ink transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
            <span
              className={`block h-[1.5px] w-5 bg-ink transition-transform ${
                menuOpen ? "-translate-y-[6.5px] -rotate-45" : ""
              }`}
            />
          </button>

          <Link href="/" className="flex items-center gap-3">
            {logoUrl && (
              <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-[#23211f] shadow-[0_2px_10px_rgba(25,24,23,.18)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt={storeName} className="h-full w-full object-cover" />
              </span>
            )}
            <span className="font-serif text-xl tracking-[.26em]">{storeName}</span>
          </Link>

          <nav className="hidden gap-8 md:flex">
            <Link
              href="/"
              className="relative py-1.5 text-xs uppercase tracking-[.18em] text-muted transition-colors hover:text-ink"
            >
              Home
            </Link>
            <Link
              href="/track"
              className="relative py-1.5 text-xs uppercase tracking-[.18em] text-muted transition-colors hover:text-ink"
            >
              Track Order
            </Link>
          </nav>

          <button
            className="relative flex h-9 w-9 items-center justify-center transition-opacity hover:opacity-60"
            aria-label="Cart"
            onClick={() => setDrawer(true)}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M6 7h12l1.2 12.2a1 1 0 0 1-1 1.1H5.8a1 1 0 0 1-1-1.1L6 7z" />
              <path d="M9 7V6a3 3 0 0 1 6 0v1" />
            </svg>
            <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[10px] font-semibold text-white">
              {count}
            </span>
          </button>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className="overflow-hidden border-t border-hairline bg-cream md:hidden"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="block border-b border-hairline px-7 py-4 text-xs uppercase tracking-[.2em] text-muted"
              >
                Home
              </Link>
              <Link
                href="/track"
                onClick={() => setMenuOpen(false)}
                className="block border-b border-hairline px-7 py-4 text-xs uppercase tracking-[.2em] text-muted"
              >
                Track Order
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
      <CartDrawer />
    </>
  );
}
