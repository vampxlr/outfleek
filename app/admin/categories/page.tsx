"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminToken } from "@/components/admin/useAdminToken";
import { PageHead, Card, Chip, Btn, Modal, Field, Toggle, inputCls } from "@/components/admin/ui";

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

function CategoryForm({ cat, onClose }: { cat: any | null; onClose: () => void }) {
  const token = useAdminToken();
  const save = useMutation(api.categories.save);
  const [name, setName] = useState(cat?.name ?? "");
  const [slug, setSlug] = useState(cat?.slug ?? "");
  const [order, setOrder] = useState(String(cat?.order ?? 0));
  const [active, setActive] = useState(cat?.active ?? true);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await save({
        token, id: cat?._id, name,
        slug: slug || slugify(name),
        order: Number(order) || 0, active,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={cat ? "Edit category" : "New category"}>
      <div className="space-y-4 text-sm">
        <Field label="Name">
          <input className={inputCls} value={name}
            onChange={(e) => { setName(e.target.value); if (!cat) setSlug(slugify(e.target.value)); }} />
        </Field>
        <Field label="Slug">
          <input className={inputCls} value={slug} onChange={(e) => setSlug(slugify(e.target.value))} />
        </Field>
        <div className="flex items-center gap-6">
          <Field label="Order">
            <input type="number" className={inputCls + " !w-24"} value={order} onChange={(e) => setOrder(e.target.value)} />
          </Field>
          <Toggle checked={active} onChange={setActive} label="Active" />
        </div>
        <div className="flex justify-end gap-2 pt-2 hairline-t">
          <Btn kind="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={submit} disabled={saving || !name}>{saving ? "Saving…" : "Save"}</Btn>
        </div>
      </div>
    </Modal>
  );
}

function Categories() {
  const token = useAdminToken();
  const cats = useQuery(api.categories.adminList, { token });
  const remove = useMutation(api.categories.remove);
  const [editing, setEditing] = useState<any | null | "new">(null);

  return (
    <div>
      <PageHead title="Categories" actions={<Btn onClick={() => setEditing("new")}>+ New category</Btn>} />
      <Card className="overflow-hidden max-w-2xl">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-muted hairline-b">
              <th className="px-4 py-2 font-normal">Name</th>
              <th className="px-2 py-2 font-normal">Slug</th>
              <th className="px-2 py-2 font-normal">Order</th>
              <th className="px-2 py-2 font-normal">Status</th>
              <th className="px-4 py-2 font-normal text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {(cats ?? []).map((c) => (
              <tr key={c._id} className="hairline-b last:border-b-0 hover:bg-cream">
                <td className="px-4 py-2.5 font-medium">{c.name}</td>
                <td className="px-2 py-2.5 text-muted">/{c.slug}</td>
                <td className="px-2 py-2.5">{c.order}</td>
                <td className="px-2 py-2.5"><Chip tone={c.active ? "green" : "neutral"}>{c.active ? "Active" : "Hidden"}</Chip></td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap">
                  <Btn kind="ghost" className="!py-1 !px-2 text-xs mr-2" onClick={() => setEditing(c)}>Edit</Btn>
                  <Btn kind="danger" className="!py-1 !px-2 text-xs"
                    onClick={() => { if (confirm(`Delete "${c.name}"?`)) remove({ token, id: c._id }); }}>
                    Delete
                  </Btn>
                </td>
              </tr>
            ))}
            {cats && cats.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted">No categories yet.</td></tr>
            )}
          </tbody>
        </table>
      </Card>
      {editing !== null && <CategoryForm cat={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

export default function Page() {
  return (
    <AdminShell>
      <Categories />
    </AdminShell>
  );
}
