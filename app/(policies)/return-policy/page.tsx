"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Header from "@/components/store/Header";
import Footer from "@/components/store/Footer";
import Reveal from "@/components/store/Reveal";

export default function ReturnPolicyPage() {
  const settings = useQuery(api.settings.publicSettings, {}) as
    | Record<string, any>
    | undefined;

  return (
    <div className="min-h-screen bg-cream text-ink flex flex-col">
      <Header />
      <section className="max-w-[1280px] mx-auto w-full px-5 sm:px-7 pt-14 pb-8 text-center border-b border-hairline">
        <Reveal>
          <div className="text-[11px] tracking-[0.34em] uppercase text-gold mb-3">Our Promise</div>
          <h1 className="font-serif font-normal text-[clamp(32px,5vw,52px)] leading-[1.1]">
            Return <em className="text-gold">Policy</em>
          </h1>
          <div className="w-14 h-px bg-gold mx-auto mt-6" />
        </Reveal>
      </section>
      <main className="max-w-[720px] mx-auto w-full px-5 sm:px-7 py-14 flex-1">
        <Reveal>
          <div className="border border-hairline bg-white p-7 sm:p-10 text-[15px] leading-[1.9] text-charcoal whitespace-pre-line">
            {settings ? String(settings.returnPolicy ?? "") : "Loading…"}
          </div>
        </Reveal>
      </main>
      <Footer />
    </div>
  );
}
