"use client";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function Footer() {
  const settings = useQuery(api.settings.publicSettings, {});
  const storeName = String(settings?.storeName ?? "LUXE TEES");
  const phone = String(settings?.contactPhone ?? "");

  return (
    <footer className="border-t border-hairline bg-[#f3f1ec]">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-9 px-5 py-12 sm:grid-cols-2 md:px-7 lg:grid-cols-[2fr_1fr_1.4fr]">
        <div>
          <div className="mb-3.5 font-serif text-lg tracking-[.26em]">{storeName}</div>
          <p className="max-w-[280px] text-[13px] text-muted">
            Premium cotton essentials — cut, stitched and finished in small batches,
            delivered anywhere in Bangladesh.
          </p>
        </div>
        <div>
          <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[.24em] text-ink">
            Quick Links
          </h4>
          <Link href="/" className="mb-2.5 block text-[13px] text-muted transition-colors hover:text-gold">
            Home
          </Link>
          <Link href="/track" className="mb-2.5 block text-[13px] text-muted transition-colors hover:text-gold">
            Track Order
          </Link>
          <Link href="/return-policy" className="mb-2.5 block text-[13px] text-muted transition-colors hover:text-gold">
            Return Policy
          </Link>
          <Link href="/privacy" className="mb-2.5 block text-[13px] text-muted transition-colors hover:text-gold">
            Privacy
          </Link>
        </div>
        <div>
          <h4 className="mb-4 text-[11px] font-semibold uppercase tracking-[.24em] text-ink">
            We Accept
          </h4>
          <div className="flex flex-wrap gap-2">
            <span className="border border-hairline bg-white px-3.5 py-1.5 text-[11px] font-semibold tracking-[.08em] text-bkash">
              bKash
            </span>
            <span className="border border-hairline bg-white px-3.5 py-1.5 text-[11px] font-semibold tracking-[.08em] text-[#ec1d24]">
              Nagad
            </span>
            <span className="border border-hairline bg-white px-3.5 py-1.5 text-[11px] font-semibold tracking-[.08em] text-muted">
              Cash on Delivery
            </span>
          </div>
          {phone && (
            <p className="mt-4 text-[13px] text-muted">
              Hotline:{" "}
              <a href={`tel:${phone}`} className="text-ink transition-colors hover:text-gold">
                {phone}
              </a>
            </p>
          )}
        </div>
      </div>
      <div className="border-t border-hairline px-4 py-4 text-center text-[11px] uppercase tracking-[.12em] text-[#a9a49b]">
        © {new Date().getFullYear()} {storeName} · Crafted in Bangladesh
      </div>
    </footer>
  );
}
