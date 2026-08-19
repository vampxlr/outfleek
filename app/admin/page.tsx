"use client";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { motion } from "framer-motion";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminToken } from "@/components/admin/useAdminToken";
import { PageHead, Card, Chip, fmtBDT, fmtDate, statusTone } from "@/components/admin/ui";

function Dashboard() {
  const token = useAdminToken();
  const data = useQuery(api.orders.dashboard, { token });

  if (!data) return <p className="text-sm text-muted">Loading…</p>;

  const stats = [
    { label: "Today", orders: data.today.orders, revenue: data.today.revenue },
    { label: "Last 7 days", orders: data.week.orders, revenue: data.week.revenue },
    { label: "Last 30 days", orders: data.month.orders, revenue: data.month.revenue },
  ];

  return (
    <div>
      <PageHead title="Dashboard" sub="Store overview" />
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="p-4">
              <p className="text-xs uppercase tracking-wide text-muted">{s.label}</p>
              <p className="serif text-xl mt-1">{fmtBDT(s.revenue)}</p>
              <p className="text-xs text-muted mt-0.5">{s.orders} orders</p>
            </Card>
          </motion.div>
        ))}
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Pending</p>
          <p className="serif text-xl mt-1 text-gold-dark">{data.pendingCount}</p>
          <Link href="/admin/orders" className="text-xs text-gold-dark underline">View orders</Link>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-muted">Abandoned</p>
          <p className="serif text-xl mt-1">{data.abandonedCount}</p>
          <Link href="/admin/abandoned" className="text-xs text-gold-dark underline">Follow up</Link>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-0 overflow-hidden">
          <h2 className="serif px-4 py-3 hairline-b">Recent orders</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <tbody>
                {data.recent.map((o: any) => (
                  <tr key={o._id} className="hairline-b last:border-b-0">
                    <td className="px-4 py-2 whitespace-nowrap font-medium">{o.orderNo}</td>
                    <td className="px-2 py-2 text-muted whitespace-nowrap">{o.customer.name}</td>
                    <td className="px-2 py-2 whitespace-nowrap">{fmtBDT(o.total)}</td>
                    <td className="px-2 py-2"><Chip tone={statusTone(o.status)}>{o.status}</Chip></td>
                    <td className="px-4 py-2 text-muted text-xs whitespace-nowrap">{fmtDate(o._creationTime)}</td>
                  </tr>
                ))}
                {data.recent.length === 0 && (
                  <tr><td className="px-4 py-6 text-muted">No orders yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-0 overflow-hidden">
          <h2 className="serif px-4 py-3 hairline-b">Landing pages</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted hairline-b">
                  <th className="px-4 py-2 font-normal">Slug</th>
                  <th className="px-2 py-2 font-normal">Status</th>
                  <th className="px-2 py-2 font-normal">Views</th>
                  <th className="px-2 py-2 font-normal">Initiates</th>
                  <th className="px-2 py-2 font-normal">Orders</th>
                  <th className="px-4 py-2 font-normal">CVR</th>
                </tr>
              </thead>
              <tbody>
                {data.landingStats.map((l: any) => (
                  <tr key={l.slug} className="hairline-b last:border-b-0">
                    <td className="px-4 py-2 font-medium whitespace-nowrap">{l.slug}</td>
                    <td className="px-2 py-2"><Chip tone={l.status === "published" ? "green" : "neutral"}>{l.status}</Chip></td>
                    <td className="px-2 py-2">{l.views}</td>
                    <td className="px-2 py-2">{l.initiates}</td>
                    <td className="px-2 py-2">{l.orders}</td>
                    <td className="px-4 py-2">{l.cvr}%</td>
                  </tr>
                ))}
                {data.landingStats.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-6 text-muted">No landing pages yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <AdminShell>
      <Dashboard />
    </AdminShell>
  );
}
