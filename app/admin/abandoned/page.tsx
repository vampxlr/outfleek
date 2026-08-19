"use client";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminToken } from "@/components/admin/useAdminToken";
import { PageHead, Card, Chip, Btn, fmtBDT, fmtDate } from "@/components/admin/ui";

function itemsSummary(items: unknown): string {
  if (!Array.isArray(items)) return "—";
  return items
    .map((i: any) => `${i.name ?? i.productName ?? "Item"}${i.size ? ` (${i.size})` : ""} ×${i.qty ?? 1}`)
    .join(", ");
}

function Abandoned() {
  const token = useAdminToken();
  const list = useQuery(api.orders.abandonedList, { token });
  const markContacted = useMutation(api.orders.markContacted);

  return (
    <div>
      <PageHead title="Abandoned Checkouts" sub="Follow up with customers who did not finish ordering" />
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-muted hairline-b">
                <th className="px-4 py-2 font-normal">Phone</th>
                <th className="px-2 py-2 font-normal">Name</th>
                <th className="px-2 py-2 font-normal">Items</th>
                <th className="px-2 py-2 font-normal">Total</th>
                <th className="px-2 py-2 font-normal">Landing</th>
                <th className="px-2 py-2 font-normal">When</th>
                <th className="px-4 py-2 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(list ?? []).map((a) => (
                <tr key={a._id} className="hairline-b last:border-b-0">
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    <a href={`tel:${a.phone}`} className="text-gold-dark underline">{a.phone}</a>
                  </td>
                  <td className="px-2 py-2.5 whitespace-nowrap">{a.name || "—"}</td>
                  <td className="px-2 py-2.5 max-w-64 truncate text-muted" title={itemsSummary(a.items)}>
                    {itemsSummary(a.items)}
                  </td>
                  <td className="px-2 py-2.5 whitespace-nowrap">{fmtBDT(a.total)}</td>
                  <td className="px-2 py-2.5 text-muted whitespace-nowrap">{a.landingSlug || "store"}</td>
                  <td className="px-2 py-2.5 text-muted text-xs whitespace-nowrap">{fmtDate(a._creationTime)}</td>
                  <td className="px-4 py-2.5 whitespace-nowrap">
                    {a.contacted ? (
                      <Chip tone="green">Contacted</Chip>
                    ) : (
                      <Btn kind="ghost" className="!py-1 !px-2 text-xs"
                        onClick={() => markContacted({ token, id: a._id })}>
                        Mark contacted
                      </Btn>
                    )}
                  </td>
                </tr>
              ))}
              {list && list.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">No abandoned checkouts.</td></tr>
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
      <Abandoned />
    </AdminShell>
  );
}
