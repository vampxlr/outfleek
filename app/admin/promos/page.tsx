"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminToken } from "@/components/admin/useAdminToken";
import { PageHead, Card, Chip, Btn, Modal, Field, Toggle, inputCls, fmtBDT } from "@/components/admin/ui";

function PromoForm({ promo, onClose }: { promo: any | null; onClose: () => void }) {
  const token = useAdminToken();
  const save = useMutation(api.promoCodes.save);
  const [code, setCode] = useState(promo?.code ?? "");
  const [kind, setKind] = useState<"percent" | "fixed">(promo?.kind ?? "percent");
  const [value, setValue] = useState(String(promo?.value ?? ""));
  const [minOrder, setMinOrder] = useState(promo?.minOrder != null ? String(promo.minOrder) : "");
  const [maxUses, setMaxUses] = useState(promo?.maxUses != null ? String(promo.maxUses) : "");
  const [expiry, setExpiry] = useState(
    promo?.expiresAt ? new Date(promo.expiresAt).toISOString().slice(0, 10) : ""
  );
  const [active, setActive] = useState(promo?.active ?? true);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await save({
        token,
        id: promo?._id,
        code: code.toUpperCase(),
        kind,
        value: Number(value) || 0,
        minOrder: minOrder ? Number(minOrder) : undefined,
        maxUses: maxUses ? Number(maxUses) : undefined,
        expiresAt: expiry ? new Date(expiry + "T23:59:59").getTime() : undefined,
        active,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={promo ? "Edit promo code" : "New promo code"}>
      <div className="space-y-4 text-sm">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Code">
            <input className={inputCls + " uppercase"} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
          </Field>
          <Field label="Type">
            <select className={inputCls} value={kind} onChange={(e) => setKind(e.target.value as any)}>
              <option value="percent">Percent (%)</option>
              <option value="fixed">Fixed (৳)</option>
            </select>
          </Field>
          <Field label={kind === "percent" ? "Discount (%)" : "Discount (৳)"}>
            <input type="number" className={inputCls} value={value} onChange={(e) => setValue(e.target.value)} />
          </Field>
          <Field label="Min order (৳)">
            <input type="number" className={inputCls} value={minOrder} onChange={(e) => setMinOrder(e.target.value)} />
          </Field>
          <Field label="Max uses">
            <input type="number" className={inputCls} value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
          </Field>
          <Field label="Expiry date">
            <input type="date" className={inputCls} value={expiry} onChange={(e) => setExpiry(e.target.value)} />
          </Field>
        </div>
        <Toggle checked={active} onChange={setActive} label="Active" />
        <div className="flex justify-end gap-2 pt-2 hairline-t">
          <Btn kind="ghost" onClick={onClose}>Cancel</Btn>
          <Btn onClick={submit} disabled={saving || !code || !value}>{saving ? "Saving…" : "Save"}</Btn>
        </div>
      </div>
    </Modal>
  );
}

function Promos() {
  const token = useAdminToken();
  const promos = useQuery(api.promoCodes.adminList, { token });
  const remove = useMutation(api.promoCodes.remove);
  const [editing, setEditing] = useState<any | null | "new">(null);

  return (
    <div>
      <PageHead title="Promo Codes" actions={<Btn onClick={() => setEditing("new")}>+ New code</Btn>} />
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-muted hairline-b">
                <th className="px-4 py-2 font-normal">Code</th>
                <th className="px-2 py-2 font-normal">Discount</th>
                <th className="px-2 py-2 font-normal">Min order</th>
                <th className="px-2 py-2 font-normal">Uses</th>
                <th className="px-2 py-2 font-normal">Expires</th>
                <th className="px-2 py-2 font-normal">Status</th>
                <th className="px-4 py-2 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(promos ?? []).map((p) => {
                const expired = p.expiresAt && p.expiresAt < Date.now();
                return (
                  <tr key={p._id} className="hairline-b last:border-b-0 hover:bg-cream">
                    <td className="px-4 py-2.5 font-medium">{p.code}</td>
                    <td className="px-2 py-2.5">{p.kind === "percent" ? `${p.value}%` : fmtBDT(p.value)}</td>
                    <td className="px-2 py-2.5 text-muted">{p.minOrder ? fmtBDT(p.minOrder) : "—"}</td>
                    <td className="px-2 py-2.5">{p.uses}{p.maxUses ? ` / ${p.maxUses}` : ""}</td>
                    <td className="px-2 py-2.5 text-muted whitespace-nowrap">
                      {p.expiresAt ? new Date(p.expiresAt).toLocaleDateString() : "Never"}
                    </td>
                    <td className="px-2 py-2.5">
                      <Chip tone={expired ? "red" : p.active ? "green" : "neutral"}>
                        {expired ? "Expired" : p.active ? "Active" : "Off"}
                      </Chip>
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <Btn kind="ghost" className="!py-1 !px-2 text-xs mr-2" onClick={() => setEditing(p)}>Edit</Btn>
                      <Btn kind="danger" className="!py-1 !px-2 text-xs"
                        onClick={() => { if (confirm(`Delete "${p.code}"?`)) remove({ token, id: p._id }); }}>
                        Delete
                      </Btn>
                    </td>
                  </tr>
                );
              })}
              {promos && promos.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">No promo codes yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      {editing !== null && <PromoForm promo={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

export default function Page() {
  return (
    <AdminShell>
      <Promos />
    </AdminShell>
  );
}
