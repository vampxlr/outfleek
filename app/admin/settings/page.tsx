"use client";
import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminToken } from "@/components/admin/useAdminToken";
import { PageHead, Card, Btn, Field, Toggle, inputCls } from "@/components/admin/ui";

type Group = { title: string; keys: { key: string; label: string; type: "text" | "number" | "bool" | "textarea" | "password"; hint?: string }[] };

const GROUPS: Group[] = [
  {
    title: "Store",
    keys: [
      { key: "storeName", label: "Store name", type: "text" },
      { key: "storeTagline", label: "Store tagline", type: "text" },
      { key: "logoUrl", label: "Logo URL (image link)", type: "text" },
      { key: "announcementBar", label: "Announcement bar", type: "text" },
      { key: "heroHeadline", label: "Hero headline", type: "text" },
      { key: "heroTagline", label: "Hero tagline", type: "text" },
      { key: "contactPhone", label: "Contact phone", type: "text" },
      { key: "whatsapp", label: "WhatsApp number", type: "text" },
    ],
  },
  {
    title: "Delivery",
    keys: [
      { key: "deliveryFeeDhaka", label: "Delivery fee — Dhaka (৳)", type: "number" },
      { key: "deliveryFeeOutside", label: "Delivery fee — Outside (৳)", type: "number" },
      { key: "freeDeliveryThreshold", label: "Free delivery threshold (৳)", type: "number" },
    ],
  },
  {
    title: "Payments",
    keys: [
      { key: "codEnabled", label: "Cash on Delivery enabled", type: "bool" },
      { key: "bkashEnabled", label: "bKash enabled", type: "bool" },
      { key: "bkashNumber", label: "bKash number", type: "text" },
      { key: "bkashInstructions", label: "bKash instructions", type: "textarea" },
    ],
  },
  {
    title: "Tracking",
    keys: [
      { key: "pixelId", label: "Meta Pixel ID", type: "text" },
      { key: "capiToken", label: "CAPI access token", type: "password" },
      { key: "testModeEnabled", label: "Test mode enabled", type: "bool" },
      { key: "testEventCode", label: "Test event code", type: "text", hint: "Remove test mode in production" },
    ],
  },
  {
    title: "Policies",
    keys: [
      { key: "returnPolicy", label: "Return policy", type: "textarea" },
      { key: "privacyPolicy", label: "Privacy policy", type: "textarea" },
    ],
  },
];

function Settings() {
  const token = useAdminToken();
  const settings = useQuery(api.settings.adminSettings, { token });
  const update = useMutation(api.settings.updateSettings);
  const [form, setForm] = useState<Record<string, any> | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (settings && !form) {
      const f: Record<string, any> = { ...settings };
      f.capiToken = ""; // empty means "leave unchanged"
      setForm(f);
    }
  }, [settings, form]);

  if (!settings || !form) return <p className="text-sm text-muted">Loading…</p>;

  const set = (k: string, v: any) => setForm((p) => ({ ...(p as any), [k]: v }));

  const save = async () => {
    setSaving(true);
    setSaved(false);
    const entries: Record<string, any> = {};
    for (const g of GROUPS) for (const k of g.keys) entries[k.key] = form[k.key];
    try {
      await update({ token, entries });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <PageHead title="Settings" sub="Store configuration"
        actions={
          <div className="flex items-center gap-3">
            {saved && <span className="text-sm text-emerald-700">Saved ✓</span>}
            <Btn onClick={save} disabled={saving}>{saving ? "Saving…" : "Save all"}</Btn>
          </div>
        } />
      <div className="space-y-6">
        {GROUPS.map((g) => (
          <Card key={g.title} className="p-5">
            <h2 className="serif text-lg mb-4">{g.title}</h2>
            <div className="space-y-4 text-sm">
              {g.keys.map((k) => {
                if (k.type === "bool")
                  return (
                    <div key={k.key} className="flex items-center justify-between">
                      <span>{k.label}</span>
                      <Toggle checked={!!form[k.key]} onChange={(v) => set(k.key, v)} />
                    </div>
                  );
                if (k.type === "textarea")
                  return (
                    <Field key={k.key} label={k.label}>
                      <textarea className={inputCls} rows={3} value={form[k.key] ?? ""} onChange={(e) => set(k.key, e.target.value)} />
                    </Field>
                  );
                if (k.type === "password")
                  return (
                    <Field key={k.key} label={k.label} hint="Leave empty to keep the current token">
                      <input
                        type="password"
                        className={inputCls}
                        value={form[k.key] ?? ""}
                        placeholder={settings.capiTokenSet ? "••• (set)" : "Not set"}
                        onChange={(e) => set(k.key, e.target.value)}
                      />
                    </Field>
                  );
                return (
                  <Field key={k.key} label={k.label} hint={k.hint}>
                    <input
                      type={k.type}
                      className={inputCls}
                      value={form[k.key] ?? ""}
                      onChange={(e) => set(k.key, k.type === "number" ? Number(e.target.value) : e.target.value)}
                    />
                  </Field>
                );
              })}
              {g.title === "Tracking" && form.testModeEnabled && (
                <p className="text-xs text-red-700 bg-red-50 rounded-sm px-3 py-2">
                  Warning: test mode is on. Remove test mode in production — events will not count toward ad optimization.
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>
      <div className="flex justify-end mt-6">
        <Btn onClick={save} disabled={saving}>{saving ? "Saving…" : "Save all"}</Btn>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AdminShell>
      <Settings />
    </AdminShell>
  );
}
