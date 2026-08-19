"use client";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminToken } from "@/components/admin/useAdminToken";
import { PageHead, Card, Btn, Field, Toggle, inputCls } from "@/components/admin/ui";

type SectionType = "hero" | "benefits" | "gallery" | "reviews" | "offer" | "sizeChart" | "faq" | "orderForm";
type Section = { type: SectionType; enabled: boolean; content: any };

const SECTION_LABELS: Record<SectionType, string> = {
  hero: "Hero", benefits: "Benefits", gallery: "Gallery", reviews: "Reviews",
  offer: "Offer", sizeChart: "Size Chart", faq: "FAQ", orderForm: "Order Form",
};

const defaultSections = (): Section[] => [
  { type: "hero", enabled: true, content: { headline: "The Perfect Tee, Finally", subheadline: "Premium cotton. Perfect fit. Delivered to your door.", ctaText: "Order Now" } },
  { type: "benefits", enabled: true, content: { items: ["100% premium combed cotton", "Pre-shrunk — keeps its shape", "Cash on delivery nationwide", "7-day easy returns"] } },
  { type: "gallery", enabled: true, content: { useProductImages: true } },
  { type: "reviews", enabled: true, content: { items: [
    { name: "Rakib H.", text: "Quality is better than expected. Ordering again!", stars: 5 },
    { name: "Tanvir A.", text: "Fits perfectly and fabric feels premium.", stars: 5 },
    { name: "Sadia K.", text: "Fast delivery, great tee.", stars: 4 },
  ] } },
  { type: "offer", enabled: true, content: { showCountdown: true, countdownMinutes: 30, showStock: true, stockText: "Only a few left in stock" } },
  { type: "sizeChart", enabled: true, content: { rows: [
    { size: "S", chest: "36\"", length: "26\"" },
    { size: "M", chest: "38\"", length: "27\"" },
    { size: "L", chest: "40\"", length: "28\"" },
    { size: "XL", chest: "42\"", length: "29\"" },
    { size: "XXL", chest: "44\"", length: "30\"" },
  ] } },
  { type: "faq", enabled: true, content: { items: [
    { q: "How do I pay?", a: "Cash on delivery or bKash — your choice." },
    { q: "How long is delivery?", a: "1-2 days inside Dhaka, 2-4 days outside." },
    { q: "Can I return it?", a: "Yes, 7-day easy returns with tags attached." },
  ] } },
  { type: "orderForm", enabled: true, content: { buttonText: "Confirm Order — Cash on Delivery" } },
];

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function SectionEditor({ section, onChange }: { section: Section; onChange: (s: Section) => void }) {
  const c = section.content ?? {};
  const setC = (patch: any) => onChange({ ...section, content: { ...c, ...patch } });

  switch (section.type) {
    case "hero":
      return (
        <div className="space-y-3">
          <Field label="Headline"><input className={inputCls} value={c.headline ?? ""} onChange={(e) => setC({ headline: e.target.value })} /></Field>
          <Field label="Subheadline"><input className={inputCls} value={c.subheadline ?? ""} onChange={(e) => setC({ subheadline: e.target.value })} /></Field>
          <Field label="CTA text"><input className={inputCls} value={c.ctaText ?? ""} onChange={(e) => setC({ ctaText: e.target.value })} /></Field>
        </div>
      );
    case "benefits": {
      const items: string[] = c.items ?? [];
      return (
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="flex gap-2">
              <input className={inputCls} value={it}
                onChange={(e) => { const arr = [...items]; arr[i] = e.target.value; setC({ items: arr }); }} />
              <button className="text-muted hover:text-red-700 px-1" onClick={() => setC({ items: items.filter((_, j) => j !== i) })}>&times;</button>
            </div>
          ))}
          <Btn kind="ghost" onClick={() => setC({ items: [...items, ""] })}>+ Add benefit</Btn>
        </div>
      );
    }
    case "gallery":
      return <Toggle checked={!!c.useProductImages} onChange={(v) => setC({ useProductImages: v })} label="Use product images" />;
    case "reviews": {
      const items: { name: string; text: string; stars: number }[] = c.items ?? [];
      return (
        <div className="space-y-3">
          {items.map((r, i) => (
            <div key={i} className="hairline rounded-sm p-3 space-y-2 relative">
              <button className="absolute top-1 right-2 text-muted hover:text-red-700" onClick={() => setC({ items: items.filter((_, j) => j !== i) })}>&times;</button>
              <div className="flex gap-2">
                <input className={inputCls + " !w-40"} placeholder="Name" value={r.name}
                  onChange={(e) => { const arr = [...items]; arr[i] = { ...r, name: e.target.value }; setC({ items: arr }); }} />
                <select className={inputCls + " !w-24"} value={r.stars}
                  onChange={(e) => { const arr = [...items]; arr[i] = { ...r, stars: Number(e.target.value) }; setC({ items: arr }); }}>
                  {[5, 4, 3, 2, 1].map((s) => <option key={s} value={s}>{s} ★</option>)}
                </select>
              </div>
              <textarea className={inputCls} rows={2} placeholder="Review text" value={r.text}
                onChange={(e) => { const arr = [...items]; arr[i] = { ...r, text: e.target.value }; setC({ items: arr }); }} />
            </div>
          ))}
          <Btn kind="ghost" onClick={() => setC({ items: [...items, { name: "", text: "", stars: 5 }] })}>+ Add review</Btn>
        </div>
      );
    }
    case "offer":
      return (
        <div className="space-y-3">
          <div className="flex items-center gap-4 flex-wrap">
            <Toggle checked={!!c.showCountdown} onChange={(v) => setC({ showCountdown: v })} label="Show countdown" />
            {c.showCountdown && (
              <input type="number" className={inputCls + " !w-24"} value={c.countdownMinutes ?? 30}
                onChange={(e) => setC({ countdownMinutes: Number(e.target.value) })} />
            )}
            {c.showCountdown && <span className="text-xs text-muted">minutes</span>}
          </div>
          <Toggle checked={!!c.showStock} onChange={(v) => setC({ showStock: v })} label="Show stock scarcity" />
          {c.showStock && (
            <Field label="Stock text">
              <input className={inputCls} value={c.stockText ?? ""} onChange={(e) => setC({ stockText: e.target.value })} />
            </Field>
          )}
        </div>
      );
    case "sizeChart": {
      const rows: { size: string; chest: string; length: string }[] = c.rows ?? [];
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs uppercase text-muted">
            <span>Size</span><span>Chest</span><span>Length</span><span />
          </div>
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
              {(["size", "chest", "length"] as const).map((k) => (
                <input key={k} className={inputCls} value={r[k]}
                  onChange={(e) => { const arr = [...rows]; arr[i] = { ...r, [k]: e.target.value }; setC({ rows: arr }); }} />
              ))}
              <button className="text-muted hover:text-red-700 px-1" onClick={() => setC({ rows: rows.filter((_, j) => j !== i) })}>&times;</button>
            </div>
          ))}
          <Btn kind="ghost" onClick={() => setC({ rows: [...rows, { size: "", chest: "", length: "" }] })}>+ Add row</Btn>
        </div>
      );
    }
    case "faq": {
      const items: { q: string; a: string }[] = c.items ?? [];
      return (
        <div className="space-y-3">
          {items.map((f, i) => (
            <div key={i} className="hairline rounded-sm p-3 space-y-2 relative">
              <button className="absolute top-1 right-2 text-muted hover:text-red-700" onClick={() => setC({ items: items.filter((_, j) => j !== i) })}>&times;</button>
              <input className={inputCls} placeholder="Question" value={f.q}
                onChange={(e) => { const arr = [...items]; arr[i] = { ...f, q: e.target.value }; setC({ items: arr }); }} />
              <textarea className={inputCls} rows={2} placeholder="Answer" value={f.a}
                onChange={(e) => { const arr = [...items]; arr[i] = { ...f, a: e.target.value }; setC({ items: arr }); }} />
            </div>
          ))}
          <Btn kind="ghost" onClick={() => setC({ items: [...items, { q: "", a: "" }] })}>+ Add question</Btn>
        </div>
      );
    }
    case "orderForm":
      return (
        <Field label="Button text">
          <input className={inputCls} value={c.buttonText ?? ""} onChange={(e) => setC({ buttonText: e.target.value })} />
        </Field>
      );
  }
}

function Builder() {
  const token = useAdminToken();
  const router = useRouter();
  const params = useSearchParams();
  const idParam = params.get("id");
  const isNew = !idParam || idParam === "new";
  const existing = useQuery(
    api.landingPages.adminGet,
    !isNew ? { token, id: idParam as Id<"landingPages"> } : "skip"
  );
  const products = useQuery(api.products.adminList, { token });
  const create = useMutation(api.landingPages.create);
  const update = useMutation(api.landingPages.update);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [productId, setProductId] = useState("");
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [priceOverride, setPriceOverride] = useState("");
  const [compareAtOverride, setCompareAtOverride] = useState("");
  const [deliveryFeeOverride, setDeliveryFeeOverride] = useState("");
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [sections, setSections] = useState<Section[]>(defaultSections);
  const [openSection, setOpenSection] = useState<SectionType | null>("hero");
  const [loadedId, setLoadedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (existing && existing._id !== loadedId) {
      setLoadedId(existing._id);
      setTitle(existing.title);
      setSlug(existing.slug);
      setSlugTouched(true);
      setProductId(existing.productId);
      setStatus(existing.status);
      setPriceOverride(existing.priceOverride != null ? String(existing.priceOverride) : "");
      setCompareAtOverride(existing.compareAtOverride != null ? String(existing.compareAtOverride) : "");
      setDeliveryFeeOverride(existing.deliveryFeeOverride != null ? String(existing.deliveryFeeOverride) : "");
      setOgTitle(existing.og?.title ?? "");
      setOgDescription(existing.og?.description ?? "");
      // merge stored sections with defaults so all 8 types show
      const stored = existing.sections as Section[];
      setSections(
        defaultSections().map((d) => stored.find((s) => s.type === d.type) ?? { ...d, enabled: false })
      );
    }
  }, [existing, loadedId]);

  const save = async () => {
    setSaving(true);
    setError("");
    const data = {
      title,
      slug: slug || slugify(title),
      productId: productId as Id<"products">,
      status,
      sections,
      priceOverride: priceOverride ? Number(priceOverride) : undefined,
      compareAtOverride: compareAtOverride ? Number(compareAtOverride) : undefined,
      deliveryFeeOverride: deliveryFeeOverride ? Number(deliveryFeeOverride) : undefined,
      og: ogTitle || ogDescription
        ? { title: ogTitle || undefined, description: ogDescription || undefined, imageId: existing?.og?.imageId }
        : existing?.og,
    };
    try {
      if (isNew) {
        await create({ token, data });
        router.push("/admin/landing");
      } else {
        await update({ token, id: idParam as Id<"landingPages">, data });
      }
    } catch (e: any) {
      setError(e?.message?.includes("Slug") ? "Slug already in use or invalid" : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (!isNew && existing === undefined) return <p className="text-sm text-muted">Loading…</p>;

  return (
    <div className="max-w-3xl">
      <PageHead
        title={isNew ? "New Landing Page" : "Edit Landing Page"}
        sub={slug ? `/l/${slug}` : undefined}
        actions={
          <>
            {!isNew && slug && (
              <a href={`/l/${slug}`} target="_blank" rel="noreferrer" className="px-4 py-2 text-sm hairline rounded-sm hover:bg-white">
                View page
              </a>
            )}
            <Btn onClick={save} disabled={saving || !title || !productId}>
              {saving ? "Saving…" : "Save"}
            </Btn>
          </>
        }
      />
      {error && <p className="text-sm text-red-700 mb-4">{error}</p>}

      <Card className="p-5 mb-6 space-y-4 text-sm">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Title">
            <input className={inputCls} value={title}
              onChange={(e) => { setTitle(e.target.value); if (!slugTouched) setSlug(slugify(e.target.value)); }} />
          </Field>
          <Field label="Slug">
            <input className={inputCls} value={slug}
              onChange={(e) => { setSlug(slugify(e.target.value)); setSlugTouched(true); }} />
          </Field>
          <Field label="Product">
            <select className={inputCls} value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">Select product…</option>
              {(products ?? []).map((p: any) => <option key={p._id} value={p._id}>{p.name}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as any)}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Field label="Price override (৳)">
            <input type="number" className={inputCls} value={priceOverride} onChange={(e) => setPriceOverride(e.target.value)} />
          </Field>
          <Field label="Compare-at override (৳)">
            <input type="number" className={inputCls} value={compareAtOverride} onChange={(e) => setCompareAtOverride(e.target.value)} />
          </Field>
          <Field label="Delivery fee override (৳)">
            <input type="number" className={inputCls} value={deliveryFeeOverride} onChange={(e) => setDeliveryFeeOverride(e.target.value)} />
          </Field>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="OG title"><input className={inputCls} value={ogTitle} onChange={(e) => setOgTitle(e.target.value)} /></Field>
          <Field label="OG description"><input className={inputCls} value={ogDescription} onChange={(e) => setOgDescription(e.target.value)} /></Field>
        </div>
      </Card>

      <h2 className="serif text-lg mb-3">Sections</h2>
      <div className="space-y-2">
        {sections.map((s, i) => (
          <Card key={s.type} className="overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3">
              <Toggle
                checked={s.enabled}
                onChange={(v) => { const arr = [...sections]; arr[i] = { ...s, enabled: v }; setSections(arr); }}
              />
              <button
                className="flex-1 text-left text-sm font-medium"
                onClick={() => setOpenSection(openSection === s.type ? null : s.type)}
              >
                {SECTION_LABELS[s.type]}
                <span className="text-muted ml-2 text-xs">{openSection === s.type ? "▴" : "▾"}</span>
              </button>
              {!s.enabled && <span className="text-xs text-muted">disabled</span>}
            </div>
            {openSection === s.type && (
              <div className="px-4 pb-4 pt-1 hairline-t text-sm">
                <SectionEditor
                  section={s}
                  onChange={(ns) => { const arr = [...sections]; arr[i] = ns; setSections(arr); }}
                />
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="flex justify-end mt-6">
        <Btn onClick={save} disabled={saving || !title || !productId}>
          {saving ? "Saving…" : isNew ? "Create page" : "Save changes"}
        </Btn>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AdminShell>
      <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
        <Builder />
      </Suspense>
    </AdminShell>
  );
}
