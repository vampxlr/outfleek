"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminToken } from "@/components/admin/useAdminToken";
import {
  PageHead, Card, Chip, Btn, Modal, Field, Toggle, inputCls, fmtBDT,
} from "@/components/admin/ui";

const SIZES = ["S", "M", "L", "XL", "XXL"];
const BADGES = ["New", "Hot", "Sale"];

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

type Variant = { size: string; color: string; stock: number };

type FormState = {
  name: string; slug: string; slugTouched: boolean; description: string;
  categoryId: string; price: string; compareAtPrice: string; cost: string;
  badges: string[]; placeholderHue: number; variants: Variant[];
  imageIds: Id<"_storage">[]; imageUrls: string; active: boolean;
};

const emptyForm = (): FormState => ({
  name: "", slug: "", slugTouched: false, description: "", categoryId: "",
  price: "", compareAtPrice: "", cost: "", badges: [], placeholderHue: 30,
  variants: [{ size: "M", color: "Black", stock: 10 }], imageIds: [], imageUrls: "", active: true,
});

function ProductForm({ product, onClose }: { product: any | null; onClose: () => void }) {
  const token = useAdminToken();
  const cats = useQuery(api.categories.adminList, { token });
  const create = useMutation(api.products.create);
  const update = useMutation(api.products.update);
  const generateUploadUrl = useMutation(api.products.generateUploadUrl);

  const [f, setF] = useState<FormState>(() =>
    product
      ? {
          name: product.name, slug: product.slug, slugTouched: true,
          description: product.description, categoryId: product.categoryId ?? "",
          price: String(product.price),
          compareAtPrice: product.compareAtPrice != null ? String(product.compareAtPrice) : "",
          cost: product.cost != null ? String(product.cost) : "",
          badges: product.badges ?? [], placeholderHue: product.placeholderHue ?? 30,
          variants: product.variants ?? [], imageIds: product.imageIds ?? [],
          imageUrls: (product.imageUrls ?? []).join("\n"),
          active: product.active,
        }
      : emptyForm()
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  // preview urls for existing images
  const existingImages: string[] = product?.images ?? [];

  const set = (patch: Partial<FormState>) => setF((p) => ({ ...p, ...patch }));

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const ids: Id<"_storage">[] = [];
      for (const file of Array.from(files)) {
        const url = await generateUploadUrl({ token });
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await res.json();
        ids.push(storageId);
      }
      set({ imageIds: [...f.imageIds, ...ids] });
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    setSaving(true);
    setError("");
    const data = {
      name: f.name,
      slug: f.slug || slugify(f.name),
      description: f.description,
      categoryId: f.categoryId ? (f.categoryId as Id<"categories">) : undefined,
      price: Number(f.price) || 0,
      compareAtPrice: f.compareAtPrice ? Number(f.compareAtPrice) : undefined,
      cost: f.cost ? Number(f.cost) : undefined,
      imageIds: f.imageIds,
      imageUrls: f.imageUrls
        .split("\n")
        .map((s) => s.trim())
        .filter((s) => /^https?:\/\//.test(s)),
      variants: f.variants.map((v) => ({ ...v, stock: Number(v.stock) || 0 })),
      badges: f.badges,
      active: f.active,
      placeholderHue: f.placeholderHue,
    };
    try {
      if (product) await update({ token, id: product._id, data });
      else await create({ token, data });
      onClose();
    } catch (e: any) {
      setError(e?.message?.includes("Slug") ? "Slug already in use" : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={product ? "Edit product" : "New product"} wide>
      <div className="space-y-4 text-sm">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Name">
            <input className={inputCls} value={f.name}
              onChange={(e) => set({ name: e.target.value, slug: f.slugTouched ? f.slug : slugify(e.target.value) })} />
          </Field>
          <Field label="Slug">
            <input className={inputCls} value={f.slug}
              onChange={(e) => set({ slug: slugify(e.target.value), slugTouched: true })} />
          </Field>
        </div>
        <Field label="Description">
          <textarea className={inputCls} rows={3} value={f.description} onChange={(e) => set({ description: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Field label="Category">
            <select className={inputCls} value={f.categoryId} onChange={(e) => set({ categoryId: e.target.value })}>
              <option value="">None</option>
              {(cats ?? []).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Price (৳)">
            <input type="number" className={inputCls} value={f.price} onChange={(e) => set({ price: e.target.value })} />
          </Field>
          <Field label="Compare at (৳)">
            <input type="number" className={inputCls} value={f.compareAtPrice} onChange={(e) => set({ compareAtPrice: e.target.value })} />
          </Field>
          <Field label="Cost (৳)">
            <input type="number" className={inputCls} value={f.cost} onChange={(e) => set({ cost: e.target.value })} />
          </Field>
        </div>

        <div className="flex flex-wrap items-center gap-6">
          <div className="flex gap-4">
            {BADGES.map((b) => (
              <label key={b} className="inline-flex items-center gap-1.5">
                <input type="checkbox" checked={f.badges.includes(b)}
                  onChange={(e) => set({ badges: e.target.checked ? [...f.badges, b] : f.badges.filter((x) => x !== b) })} />
                {b}
              </label>
            ))}
          </div>
          <Toggle checked={f.active} onChange={(v) => set({ active: v })} label="Active" />
        </div>

        <Field label={`Placeholder hue (${f.placeholderHue})`} hint="Used when the product has no images">
          <div className="flex items-center gap-3">
            <input type="range" min={0} max={360} value={f.placeholderHue}
              onChange={(e) => set({ placeholderHue: Number(e.target.value) })} className="flex-1" />
            <div className="w-16 h-10 rounded-sm hairline"
              style={{ background: `linear-gradient(135deg, hsl(${f.placeholderHue} 45% 82%), hsl(${f.placeholderHue} 35% 62%))` }} />
          </div>
        </Field>

        <div>
          <span className="block text-xs uppercase tracking-wide text-muted mb-1">Variants</span>
          <div className="space-y-2">
            {f.variants.map((v, i) => (
              <div key={i} className="flex gap-2 items-center">
                <select className={inputCls + " !w-24"} value={v.size}
                  onChange={(e) => { const vs = [...f.variants]; vs[i] = { ...v, size: e.target.value }; set({ variants: vs }); }}>
                  {SIZES.map((s) => <option key={s}>{s}</option>)}
                </select>
                <input className={inputCls + " !w-36"} placeholder="Color" value={v.color}
                  onChange={(e) => { const vs = [...f.variants]; vs[i] = { ...v, color: e.target.value }; set({ variants: vs }); }} />
                <input type="number" className={inputCls + " !w-24"} placeholder="Stock" value={v.stock}
                  onChange={(e) => { const vs = [...f.variants]; vs[i] = { ...v, stock: Number(e.target.value) }; set({ variants: vs }); }} />
                <button className="text-muted hover:text-red-700 px-2" onClick={() => set({ variants: f.variants.filter((_, j) => j !== i) })}>
                  &times;
                </button>
              </div>
            ))}
          </div>
          <Btn kind="ghost" className="mt-2" onClick={() => set({ variants: [...f.variants, { size: "M", color: "", stock: 0 }] })}>
            + Add variant
          </Btn>
        </div>

        <div>
          <span className="block text-xs uppercase tracking-wide text-muted mb-1">Images</span>
          <div className="flex flex-wrap gap-2 mb-2">
            {f.imageIds.map((id, i) => {
              const url = product && product.imageIds?.indexOf(id) > -1
                ? existingImages[product.imageIds.indexOf(id)]
                : null;
              return (
                <div key={String(id)} className="relative w-20 h-20 rounded-sm hairline overflow-hidden bg-cream">
                  {url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="flex items-center justify-center h-full text-xs text-muted">new</span>
                  )}
                  <button
                    onClick={() => set({ imageIds: f.imageIds.filter((_, j) => j !== i) })}
                    className="absolute top-0 right-0 bg-ink/70 text-cream w-5 h-5 text-xs leading-none"
                  >
                    &times;
                  </button>
                </div>
              );
            })}
          </div>
          <input type="file" accept="image/*" multiple onChange={(e) => upload(e.target.files)} className="text-xs" />
          {uploading && <p className="text-xs text-muted mt-1">Uploading…</p>}
          <div className="mt-3">
            <label className="mb-1 block text-[11px] uppercase tracking-wider text-muted">
              Image URLs (one per line — external links, e.g. ImgBB/Cloudinary direct links)
            </label>
            <textarea
              value={f.imageUrls}
              onChange={(e) => set({ imageUrls: e.target.value })}
              rows={3}
              placeholder="https://i.ibb.co/xxxx/shirt-front.jpg"
              className="w-full rounded border border-hairline bg-white px-3 py-2 text-xs"
            />
          </div>
        </div>

        {error && <p className="text-red-700">{error}</p>}
        <div className="flex justify-end gap-2 pt-2 hairline-t">
          <Btn kind="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={save} disabled={saving || !f.name || !f.price}>{saving ? "Saving…" : "Save product"}</Btn>
        </div>
      </div>
    </Modal>
  );
}

function Products() {
  const token = useAdminToken();
  const products = useQuery(api.products.adminList, { token });
  const remove = useMutation(api.products.remove);
  const [editing, setEditing] = useState<any | null | "new">(null);

  return (
    <div>
      <PageHead title="Products" sub="Catalog and inventory"
        actions={<Btn onClick={() => setEditing("new")}>+ New product</Btn>} />
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-muted hairline-b">
                <th className="px-4 py-2 font-normal">Product</th>
                <th className="px-2 py-2 font-normal">Price</th>
                <th className="px-2 py-2 font-normal">Stock</th>
                <th className="px-2 py-2 font-normal">Badges</th>
                <th className="px-2 py-2 font-normal">Status</th>
                <th className="px-4 py-2 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(products ?? []).map((p: any) => {
                const stock = p.variants.reduce((s: number, v: any) => s + v.stock, 0);
                return (
                  <tr key={p._id} className="hairline-b last:border-b-0 hover:bg-cream">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-sm overflow-hidden hairline shrink-0"
                          style={{ background: `linear-gradient(135deg, hsl(${p.placeholderHue ?? 30} 45% 82%), hsl(${p.placeholderHue ?? 30} 35% 62%))` }}>
                          {p.images?.[0] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-xs text-muted">/{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-2 py-2.5 whitespace-nowrap">
                      {fmtBDT(p.price)}
                      {p.compareAtPrice && <span className="text-muted line-through text-xs ml-1">{fmtBDT(p.compareAtPrice)}</span>}
                    </td>
                    <td className="px-2 py-2.5">
                      <Chip tone={stock > 0 ? "neutral" : "red"}>{stock}</Chip>
                    </td>
                    <td className="px-2 py-2.5 space-x-1">
                      {p.badges.map((b: string) => <Chip key={b} tone="gold">{b}</Chip>)}
                    </td>
                    <td className="px-2 py-2.5">
                      <Chip tone={p.active ? "green" : "neutral"}>{p.active ? "Active" : "Hidden"}</Chip>
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <Btn kind="ghost" className="!py-1 !px-2 text-xs mr-2" onClick={() => setEditing(p)}>Edit</Btn>
                      <Btn kind="danger" className="!py-1 !px-2 text-xs"
                        onClick={() => { if (confirm(`Delete "${p.name}"?`)) remove({ token, id: p._id }); }}>
                        Delete
                      </Btn>
                    </td>
                  </tr>
                );
              })}
              {products && products.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">No products yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      {editing !== null && (
        <ProductForm product={editing === "new" ? null : editing} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}

export default function Page() {
  return (
    <AdminShell>
      <Products />
    </AdminShell>
  );
}
