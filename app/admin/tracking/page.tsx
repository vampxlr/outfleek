"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminToken } from "@/components/admin/useAdminToken";
import { PageHead, Card, Chip, fmtDate } from "@/components/admin/ui";

function Tracking() {
  const token = useAdminToken();
  const logs = useQuery(api.capiHelpers.recentLogs, { token });
  const settings = useQuery(api.settings.adminSettings, { token });

  const checks = settings
    ? [
        { label: "Meta Pixel ID set", ok: !!settings.pixelId, detail: settings.pixelId ? String(settings.pixelId) : "Add it in Settings → Tracking" },
        { label: "CAPI access token set", ok: !!settings.capiTokenSet, detail: settings.capiTokenSet ? "Configured" : "Add it in Settings → Tracking" },
        { label: "Test mode", ok: !settings.testModeEnabled, detail: settings.testModeEnabled ? "ON — remove test mode in production!" : "Off (production ready)" },
      ]
    : [];

  return (
    <div>
      <PageHead title="Tracking Debug" sub="Server-side CAPI event log and setup checklist" />

      <Card className="p-5 mb-6 max-w-xl">
        <h2 className="serif text-lg mb-3">Setup checklist</h2>
        <ul className="space-y-2 text-sm">
          {checks.map((c) => (
            <li key={c.label} className="flex items-start gap-2">
              <span className={c.ok ? "text-emerald-600" : "text-red-600"}>{c.ok ? "✓" : "✗"}</span>
              <span>
                <span className="font-medium">{c.label}</span>
                <span className={`block text-xs ${!c.ok || c.label === "Test mode" && settings?.testModeEnabled ? "text-red-700" : "text-muted"}`}>
                  {c.detail}
                </span>
              </span>
            </li>
          ))}
          {!settings && <li className="text-muted">Loading…</li>}
        </ul>
      </Card>

      <Card className="overflow-hidden">
        <h2 className="serif px-4 py-3 hairline-b">Recent CAPI events</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-muted hairline-b">
                <th className="px-4 py-2 font-normal">Event</th>
                <th className="px-2 py-2 font-normal">Event ID</th>
                <th className="px-2 py-2 font-normal">Status</th>
                <th className="px-2 py-2 font-normal">Attempt</th>
                <th className="px-2 py-2 font-normal">Response</th>
                <th className="px-4 py-2 font-normal">Time</th>
              </tr>
            </thead>
            <tbody>
              {(logs ?? []).map((l) => (
                <tr key={l._id} className="hairline-b last:border-b-0">
                  <td className="px-4 py-2.5 font-medium whitespace-nowrap">{l.eventName}</td>
                  <td className="px-2 py-2.5 text-muted text-xs max-w-48 truncate" title={l.eventId}>{l.eventId}</td>
                  <td className="px-2 py-2.5">
                    <Chip tone={l.status === "ok" ? "green" : l.status === "retry" ? "gold" : "red"}>{l.status}</Chip>
                  </td>
                  <td className="px-2 py-2.5">{l.attempt}</td>
                  <td className="px-2 py-2.5 text-muted text-xs max-w-72 truncate" title={l.responseSummary}>{l.responseSummary}</td>
                  <td className="px-4 py-2.5 text-muted text-xs whitespace-nowrap">{fmtDate(l._creationTime)}</td>
                </tr>
              ))}
              {logs && logs.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted">No CAPI events logged yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default function Page() {
  return (
    <AdminShell>
      <Tracking />
    </AdminShell>
  );
}
