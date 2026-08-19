"use client";

import { useEffect, useRef } from "react";

const REPO = "https://github.com/vampxlr/outfleek";
const LIVE = "https://outfleek.vercel.app";

type Item = {
  href: string;
  title: string;
  desc: string;
  meta: string;
  icon: string;
  external?: boolean;
  primary?: boolean;
};

const DELIVERABLES: Item[] = [
  {
    href: "/project/LAB-REPORT.pdf",
    title: "Testing & Validation Report",
    desc: "The full lab report — 42 black-box test cases across 11 modules plus a complete white-box section (coverage, cyclomatic complexity, basis path testing, boundary value analysis).",
    meta: "PDF · 67 pages",
    icon: "📕",
    primary: true,
  },
  {
    href: "/project/LAB-REPORT.html",
    title: "Lab Report (web version)",
    desc: "The same report as an interactive page: sticky contents, scroll-spy, and click-to-zoom on all 22 screenshots.",
    meta: "HTML · interactive",
    icon: "🧪",
  },
  {
    href: "/project/presentation/index.html",
    title: "Presentation Deck",
    desc: "22 animated slides split across two presenters (10 minutes each), with speaker notes (N), a segment timer (T), and keyboard navigation.",
    meta: "HTML · 22 slides",
    icon: "🎞️",
    primary: true,
  },
  {
    href: "/project/tutorial.html",
    title: "Learning Tutorial",
    desc: "A 13-chapter walkthrough of how this platform is built — architecture, Convex, Framer Motion, payments, tracking, testing — with 10 graded exercises.",
    meta: "HTML · ~8,000 words",
    icon: "📘",
    primary: true,
  },
  {
    href: "/project/graph.html",
    title: "Codebase Knowledge Graph",
    desc: "An interactive force-directed graph of the whole codebase: 396 nodes across 30 detected communities.",
    meta: "HTML · interactive",
    icon: "🕸️",
  },
  {
    href: "/project/TEST-EVIDENCE.md",
    title: "Raw Test Evidence",
    desc: "Every executed result behind the report: unit-test output, 12 black-box API probes, the atomicity test, the price-tampering test, and the delivery-threshold checks.",
    meta: "Markdown",
    icon: "🔬",
  },
  {
    href: "/project/REQUIREMENTS.md",
    title: "Product Requirements",
    desc: "The original specification the platform was built against.",
    meta: "Markdown",
    icon: "📋",
  },
  {
    href: REPO,
    title: "Source Code",
    desc: "The complete public repository — application, Convex backend, unit tests, and all documentation.",
    meta: "GitHub · public",
    icon: "💻",
    external: true,
  },
];

const STATS = [
  { n: "81", l: "Unit tests" },
  { n: "98.63%", l: "Statements" },
  { n: "98.24%", l: "Branches" },
  { n: "125", l: "Total cases" },
];

const STACK = [
  "Next.js 15",
  "TypeScript",
  "Convex",
  "Framer Motion",
  "Tailwind v4",
  "Vitest",
  "Playwright",
  "Vercel",
];

export default function ProjectHub() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const pct = (h.scrollTop / (h.scrollHeight - h.clientHeight || 1)) * 100;
      if (barRef.current) barRef.current.style.width = `${pct}%`;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const io = new IntersectionObserver(
      (es) =>
        es.forEach((e) => e.isIntersecting && e.target.classList.add("in")),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect();
    };
  }, []);

  return (
    <>
      <style>{CSS}</style>

      <div className="bg-field">
        <div className="orb a" />
        <div className="orb b" />
        <div className="orb c" />
      </div>
      <div className="bg-grain" />
      <div className="progress" ref={barRef} />

      <main className="ph-wrap">
        <header className="ph-hero glass-raised reveal">
          <div className="eyebrow">Dhaka International University · Group 4</div>
          <h1>Outfleek — Project Documentation</h1>
          <p className="lede">
            Engineering and testing documentation for a production e-commerce
            platform built for the Bangladeshi market: Cash on Delivery and
            bKash checkout, a configurable admin panel, a Facebook-ad
            landing-page builder, and Meta Pixel + Conversions API tracking.
          </p>

          <div className="ph-stats">
            {STATS.map((s) => (
              <div className="ph-stat glass" key={s.l}>
                <div className="n">{s.n}</div>
                <div className="l">{s.l}</div>
              </div>
            ))}
          </div>

          <div className="ph-pills">
            {STACK.map((s) => (
              <span className="pill" key={s}>
                {s}
              </span>
            ))}
          </div>

          <div className="ph-links">
            <a className="ph-cta" href={LIVE}>
              Visit the live store →
            </a>
            <a className="ph-cta ghost" href={REPO}>
              View source on GitHub
            </a>
          </div>
        </header>

        <section className="ph-sec reveal">
          <h2>Deliverables</h2>
          <div className="ph-grid">
            {DELIVERABLES.map((d) => (
              <a
                key={d.href}
                className={`ph-card glass${d.primary ? " is-primary" : ""}`}
                href={d.href}
                target="_blank"
                rel="noreferrer"
              >
                <div className="ph-ico">{d.icon}</div>
                <div className="ph-body">
                  <h3>{d.title}</h3>
                  <p>{d.desc}</p>
                  <span className="ph-meta">
                    {d.meta}
                    {d.external ? " · external" : ""}
                  </span>
                </div>
                <span className="ph-arrow" aria-hidden>
                  ↗
                </span>
              </a>
            ))}
          </div>
        </section>

        <section className="ph-sec reveal">
          <h2>Application screenshots</h2>
          <p className="ph-sub">
            All 22 captures used as numbered figures in the lab report. Click
            any thumbnail to open it full size.
          </p>
          <div className="ph-shots">
            {SHOTS.map((s, i) => (
              <a
                className="ph-shot"
                key={s.f}
                href={`/project/screenshots/${s.f}`}
                target="_blank"
                rel="noreferrer"
              >
                <span className="dots">
                  <i />
                  <i />
                  <i />
                </span>
                <span className="zoom">⤢</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`/project/screenshots/${s.f}`}
                  alt={s.t}
                  loading="lazy"
                />
                <span className="cap">
                  <b>Fig {i + 1}</b> · {s.t}
                </span>
              </a>
            ))}
          </div>
        </section>

        <footer className="ph-foot glass">
          <p>
            Outfleek · Software Testing &amp; Quality Assurance Lab (0613-308) ·
            Group 4 — Shazidul Islam Suvo (23), Rahimur Rahman Rahim (25), Abul
            Kalam Azad Kiron (33), Tarik Jamil (35)
          </p>
          <p className="dim">
            This page is unlisted — it is not linked from the store and is
            excluded from search engines.
          </p>
        </footer>
      </main>
    </>
  );
}

const SHOTS = [
  { f: "01-home-listing.png", t: "Home / product listing" },
  { f: "02-home-mobile.png", t: "Home on mobile (390px)" },
  { f: "03-product-detail.png", t: "Product detail page" },
  { f: "04-cart-drawer.png", t: "Slide-in cart drawer" },
  { f: "05-cart-page.png", t: "Cart page with items" },
  { f: "06-checkout-form.png", t: "Checkout form" },
  { f: "07-checkout-validation-error.png", t: "Phone validation error" },
  { f: "08-checkout-bkash.png", t: "bKash payment panel" },
  { f: "09-order-success.png", t: "Order confirmation" },
  { f: "10-track-order.png", t: "Order tracking timeline" },
  { f: "11-landing-page.png", t: "Ad landing page" },
  { f: "12-landing-order-form.png", t: "Inline order form" },
  { f: "13-admin-login.png", t: "Admin login" },
  { f: "14-admin-dashboard.png", t: "Admin dashboard" },
  { f: "15-admin-orders.png", t: "Order management" },
  { f: "16-admin-order-detail.png", t: "Order detail" },
  { f: "17-admin-products.png", t: "Product management" },
  { f: "18-admin-product-form.png", t: "Product form" },
  { f: "19-admin-landing-list.png", t: "Landing pages list" },
  { f: "20-admin-landing-builder.png", t: "Landing page builder" },
  { f: "21-admin-settings.png", t: "Settings" },
  { f: "22-admin-tracking-debug.png", t: "CAPI tracking debug" },
];

const CSS = `
:root{
  --bg-0:#080B12;--bg-1:#0B0F1A;
  --accent:#7C9CFF;--accent-2:#4ED8C4;--accent-soft:rgba(124,156,255,.16);
  --glass:linear-gradient(180deg,rgba(255,255,255,.075),rgba(255,255,255,.035)),rgba(10,14,24,.30);
  --glass-raised:linear-gradient(180deg,rgba(255,255,255,.105),rgba(255,255,255,.05)),rgba(10,14,24,.26);
  --glass-inset:rgba(4,7,14,.44);
  --stroke:rgba(255,255,255,.10);--stroke-strong:rgba(255,255,255,.16);
  --edge:inset 0 1px 0 rgba(255,255,255,.14);--edge-strong:inset 0 1px 0 rgba(255,255,255,.22);
  --drop:0 16px 40px rgba(0,0,0,.42);--drop-lg:0 28px 70px rgba(0,0,0,.52);
  --ink:#EEF2F9;--ink-2:rgba(238,242,249,.66);--ink-3:rgba(238,242,249,.42);
  --r:16px;--r-lg:22px;
  --sans:"Inter","Segoe UI Variable Text","Segoe UI",system-ui,-apple-system,sans-serif;
  --mono:"JetBrains Mono","SF Mono",ui-monospace,Consolas,monospace;
}
html{scroll-behavior:smooth}
body{margin:0;background:var(--bg-1);color:var(--ink);font-family:var(--sans);
  -webkit-font-smoothing:antialiased;line-height:1.65;}
.bg-field{position:fixed;inset:0;z-index:-2;overflow:hidden;
  background:
    radial-gradient(1200px 800px at 12% -8%,#1B2757 0%,transparent 60%),
    radial-gradient(1000px 720px at 100% 2%,#113B49 0%,transparent 56%),
    radial-gradient(900px 700px at 50% 106%,#251A4E 0%,transparent 58%),
    linear-gradient(180deg,var(--bg-0),var(--bg-1) 42%,#070A11 100%);}
.orb{position:absolute;border-radius:50%;filter:blur(115px);opacity:.5;will-change:transform}
.orb.a{width:46vw;height:46vw;left:-8vw;top:-10vw;background:#3B5BDB;animation:d1 34s ease-in-out infinite}
.orb.b{width:38vw;height:38vw;right:-6vw;top:6vh;background:#0E7490;animation:d2 40s ease-in-out infinite}
.orb.c{width:36vw;height:36vw;left:26vw;bottom:-14vw;background:#6D3BDB;opacity:.34;animation:d3 46s ease-in-out infinite}
@keyframes d1{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(6vw,4vh,0) scale(1.12)}}
@keyframes d2{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(-5vw,6vh,0) scale(1.08)}}
@keyframes d3{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(4vw,-5vh,0) scale(1.15)}}
.bg-grain{position:fixed;inset:0;z-index:-1;pointer-events:none;opacity:.03;
  background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E")}
.progress{position:fixed;top:0;left:0;height:2px;z-index:100;width:0;
  background:linear-gradient(90deg,var(--accent),var(--accent-2));box-shadow:0 0 12px rgba(124,156,255,.55)}
.glass{background:var(--glass);-webkit-backdrop-filter:blur(26px) saturate(125%);backdrop-filter:blur(26px) saturate(125%);
  border:1px solid var(--stroke);border-radius:var(--r-lg);box-shadow:var(--edge),var(--drop)}
.glass-raised{background:var(--glass-raised);-webkit-backdrop-filter:blur(32px) saturate(130%);backdrop-filter:blur(32px) saturate(130%);
  border:1px solid var(--stroke-strong);border-radius:var(--r-lg);box-shadow:var(--edge-strong),var(--drop-lg)}
.pill{display:inline-flex;align-items:center;padding:.4em .85em;border-radius:999px;
  background:var(--glass-raised);border:1px solid var(--stroke);box-shadow:var(--edge);
  font-size:.79rem;color:var(--ink-2);transition:transform .24s,border-color .24s,color .24s}
.pill:hover{transform:translateY(-2px);border-color:rgba(124,156,255,.45);color:var(--ink)}
.eyebrow{font-size:.7rem;font-weight:640;letter-spacing:.15em;text-transform:uppercase;color:var(--accent);margin:0 0 .8em}
.lede{font-size:1.06rem;color:var(--ink-2);max-width:70ch}
/* the store's globals.css sets a serif on headings — the glass system is one sans face */
.ph-wrap h1,.ph-wrap h2,.ph-wrap h3,.ph-wrap h4,.ph-foot,.ph-wrap p,.ph-wrap a,.ph-wrap span,.ph-wrap div{font-family:var(--sans)}
h1{font-size:clamp(2rem,4.2vw,2.95rem);font-weight:700;letter-spacing:-.03em;line-height:1.14;margin:0 0 .45em;text-wrap:balance}
h2{font-size:clamp(1.35rem,2.2vw,1.8rem);font-weight:650;letter-spacing:-.02em;margin:0 0 .2em}
h3{font-size:1.03rem;font-weight:640;margin:0 0 .3em;letter-spacing:-.012em}
p{margin:0 0 1em;color:var(--ink-2)}
.reveal{opacity:0;transform:translateY(22px);transition:opacity .6s cubic-bezier(.22,.7,.3,1),transform .6s cubic-bezier(.22,.7,.3,1)}
.reveal.in{opacity:1;transform:none}

.ph-wrap{max-width:1180px;margin:0 auto;padding:60px 24px 80px}
.ph-hero{padding:44px 44px 38px;margin-bottom:44px}
.ph-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:26px 0 22px}
.ph-stat{padding:18px 14px;text-align:center;border-radius:var(--r)}
.ph-stat .n{font-size:1.75rem;font-weight:700;letter-spacing:-.03em;color:#fff}
.ph-stat .l{font-size:.7rem;text-transform:uppercase;letter-spacing:.1em;color:var(--ink-3);margin-top:2px}
.ph-pills{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:26px}
.ph-links{display:flex;gap:12px;flex-wrap:wrap}
.ph-cta{display:inline-flex;align-items:center;padding:.72em 1.35em;border-radius:12px;font-size:.9rem;font-weight:600;
  text-decoration:none;color:#0B0F1A;background:linear-gradient(180deg,#A9C0FF,#7C9CFF);
  border:1px solid rgba(255,255,255,.2);box-shadow:var(--edge),0 10px 26px rgba(124,156,255,.24);
  transition:transform .24s,box-shadow .24s}
.ph-cta:hover{transform:translateY(-2px);box-shadow:var(--edge),0 16px 34px rgba(124,156,255,.34)}
.ph-cta.ghost{background:var(--glass-raised);color:var(--ink);border:1px solid var(--stroke-strong);box-shadow:var(--edge)}
.ph-cta.ghost:hover{border-color:rgba(124,156,255,.5)}

.ph-sec{margin-bottom:48px}
.ph-sub{color:var(--ink-3);font-size:.92rem;margin:-2px 0 20px}
.ph-sec h2{margin-bottom:18px}
.ph-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:16px}
.ph-card{display:flex;gap:16px;padding:22px 22px 20px;text-decoration:none;color:inherit;position:relative;
  border-radius:var(--r-lg);transition:transform .3s cubic-bezier(.22,.7,.3,1),border-color .3s,box-shadow .3s}
.ph-card:hover{transform:translateY(-5px);border-color:rgba(124,156,255,.4);
  box-shadow:var(--edge),0 24px 52px rgba(0,0,0,.5),0 0 0 1px rgba(124,156,255,.18)}
.ph-card.is-primary{border-color:rgba(124,156,255,.26)}
.ph-ico{font-size:1.5rem;line-height:1;flex:none;width:44px;height:44px;border-radius:13px;display:grid;place-items:center;
  background:var(--glass-inset);border:1px solid var(--stroke);box-shadow:var(--edge)}
.ph-body{min-width:0}
.ph-card p{font-size:.875rem;margin:0 0 .55em;color:var(--ink-2)}
.ph-meta{font-size:.72rem;text-transform:uppercase;letter-spacing:.09em;color:var(--ink-3)}
.ph-arrow{position:absolute;top:18px;right:18px;color:var(--ink-3);font-size:1rem;transition:transform .3s,color .3s}
.ph-card:hover .ph-arrow{transform:translate(3px,-3px);color:var(--accent)}

.ph-shots{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px}
.ph-shot{position:relative;display:block;aspect-ratio:16/10;border-radius:14px;overflow:hidden;cursor:zoom-in;
  background:var(--glass-inset);border:1px solid var(--stroke);box-shadow:var(--edge),0 10px 26px rgba(0,0,0,.38);
  transition:transform .36s cubic-bezier(.22,.7,.3,1),border-color .36s,box-shadow .36s}
.ph-shot::before{content:"";position:absolute;inset:0 0 auto 0;height:22px;z-index:2;
  background:linear-gradient(180deg,rgba(16,21,34,.94),rgba(16,21,34,.62));
  border-bottom:1px solid rgba(255,255,255,.07);box-shadow:inset 0 1px 0 rgba(255,255,255,.1)}
.ph-shot .dots{position:absolute;top:7px;left:10px;z-index:3;display:flex;gap:5px}
.ph-shot .dots i{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.22)}
.ph-shot img{width:100%;height:100%;object-fit:cover;object-position:top center;padding-top:22px;background:#0d1220;
  transition:transform .5s cubic-bezier(.22,.7,.3,1),filter .36s;filter:saturate(1.02)}
.ph-shot:hover{transform:translateY(-6px) scale(1.012);border-color:rgba(124,156,255,.42);
  box-shadow:var(--edge),0 22px 50px rgba(0,0,0,.5),0 0 0 1px rgba(124,156,255,.22)}
.ph-shot:hover img{transform:scale(1.05);filter:saturate(1.1) brightness(1.06)}
.ph-shot .zoom{position:absolute;z-index:4;top:30px;right:9px;width:28px;height:28px;border-radius:9px;
  display:grid;place-items:center;background:rgba(10,14,24,.62);border:1px solid rgba(255,255,255,.16);
  box-shadow:var(--edge);color:var(--ink);font-size:13px;opacity:0;transform:translateY(-4px) scale(.9);
  transition:opacity .3s,transform .3s;-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}
.ph-shot:hover .zoom{opacity:1;transform:none}
.ph-shot .cap{position:absolute;left:0;right:0;bottom:0;z-index:3;padding:16px 11px 8px;font-size:11.5px;color:var(--ink);
  background:linear-gradient(0deg,rgba(6,9,16,.94),rgba(6,9,16,.5) 60%,transparent)}
.ph-shot .cap b{color:var(--accent-2);font-weight:640}

.ph-foot{padding:24px 28px;text-align:center;font-size:.84rem}
.ph-foot p{margin:0 0 .3em}
.ph-foot .dim{color:var(--ink-3);font-size:.78rem;margin:0}

@media (max-width:820px){
  .ph-wrap{padding:36px 16px 60px}
  .ph-hero{padding:30px 22px 26px}
  .ph-stats{grid-template-columns:repeat(2,1fr)}
  .ph-grid,.ph-shots{grid-template-columns:1fr}
}
@media (prefers-reduced-motion:reduce){
  *{animation:none!important;transition:none!important}
  .reveal{opacity:1;transform:none}
}
`;
