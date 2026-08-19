"use client";
import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminToken } from "@/components/admin/useAdminToken";
import {
  PageHead, Card, Chip, Btn, Drawer, Field, inputCls, fmtBDT, fmtDate, statusTone,
} from "@/components/admin/ui";

const STATUSES = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled", "returned"];
const TABS = ["all", ...STATUSES];

function OrderDetail({ id, onClose }: { id: Id<"orders">; onClose: () => void }) {
  const token = useAdminToken();
  const order = useQuery(api.orders.adminGet, { token, id });
  const adminUpdate = useMutation(api.orders.adminUpdate);
  const updateStatus = useMutation(api.orders.updateStatus);
  const [courierName, setCourierName] = useState<string | null>(null);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState<string | null>(null);

  if (!order) return <Drawer open onClose={onClose} title="Order"><p className="text-sm text-muted">Loading…</p></Drawer>;

  const cName = courierName ?? order.courier?.name ?? "";
  const cTrack = trackingId ?? order.courier?.trackingId ?? "";
  const iNotes = notes ?? order.internalNotes ?? "";
  const rReason = returnReason ?? order.returnReason ?? "";

  const printInvoice = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<!doctype html><html><head><title>Invoice ${order.orderNo}</title>
<style>body{font-family:Georgia,serif;max-width:640px;margin:32px auto;color:#1a1a1a;padding:0 16px}
table{width:100%;border-collapse:collapse;margin:16px 0}td,th{padding:8px;border-bottom:1px solid #e6e2db;text-align:left}
h1{font-size:22px}.muted{color:#77736c;font-size:13px}.tot{text-align:right}</style></head><body>
<h1>LUXE TEES</h1>
<p class="muted">Invoice · ${order.orderNo} · ${new Date(order._creationTime).toLocaleDateString()}</p>
<p><strong>${order.customer.name}</strong><br/>${order.customer.phone}<br/>${order.customer.address}</p>
<table><tr><th>Item</th><th>Size</th><th>Qty</th><th class="tot">Price</th></tr>
${order.items.map((i) => `<tr><td>${i.name}</td><td>${i.size}${i.color ? " / " + i.color : ""}</td><td>${i.qty}</td><td class="tot">৳${i.price * i.qty}</td></tr>`).join("")}
<tr><td colspan="3">Subtotal</td><td class="tot">৳${order.subtotal}</td></tr>
${order.discount ? `<tr><td colspan="3">Discount</td><td class="tot">-৳${order.discount}</td></tr>` : ""}
<tr><td colspan="3">Delivery</td><td class="tot">৳${order.deliveryFee}</td></tr>
<tr><td colspan="3"><strong>Total</strong></td><td class="tot"><strong>৳${order.total}</strong></td></tr></table>
<p class="muted">Payment: ${order.payment.method === "bkash" ? "bKash" : "Cash on Delivery"}${order.payment.verified ? " (verified)" : ""}</p>
<p class="muted">Thank you for shopping with LUXE TEES.</p>
<script>window.print()</script></body></html>`);
    w.document.close();
  };

  return (
    <Drawer open onClose={onClose} title={order.orderNo}>
      <div className="space-y-6 text-sm">
        <div className="flex items-center justify-between">
          <select
            value={order.status}
            onChange={(e) => updateStatus({ token, id, status: e.target.value })}
            className={inputCls + " max-w-40"}
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <Btn kind="ghost" onClick={printInvoice}>Print invoice</Btn>
        </div>

        <section>
          <h3 className="serif mb-2">Customer</h3>
          <p className="font-medium">{order.customer.name}</p>
          <p><a href={`tel:${order.customer.phone}`} className="text-gold-dark underline">{order.customer.phone}</a></p>
          <p className="text-muted">{order.customer.address} · {order.customer.area === "dhaka" ? "Dhaka" : "Outside Dhaka"}</p>
          {order.customer.notes && <p className="text-muted mt-1">Note: {order.customer.notes}</p>}
        </section>

        <section>
          <h3 className="serif mb-2">Items</h3>
          {order.items.map((i, idx) => (
            <div key={idx} className="flex justify-between py-1.5 hairline-b last:border-b-0">
              <span>{i.name} <span className="text-muted">· {i.size}{i.color ? ` / ${i.color}` : ""} × {i.qty}</span></span>
              <span>{fmtBDT(i.price * i.qty)}</span>
            </div>
          ))}
          <div className="mt-2 space-y-1 text-muted">
            <div className="flex justify-between"><span>Subtotal</span><span>{fmtBDT(order.subtotal)}</span></div>
            {order.discount > 0 && <div className="flex justify-between"><span>Discount{order.promoCode ? ` (${order.promoCode})` : ""}</span><span>-{fmtBDT(order.discount)}</span></div>}
            <div className="flex justify-between"><span>Delivery</span><span>{fmtBDT(order.deliveryFee)}</span></div>
            <div className="flex justify-between text-ink font-medium"><span>Total</span><span>{fmtBDT(order.total)}</span></div>
          </div>
        </section>

        <section>
          <h3 className="serif mb-2">Payment</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <Chip tone={order.payment.method === "bkash" ? "blue" : "neutral"}>
              {order.payment.method === "bkash" ? "bKash" : "COD"}
            </Chip>
            <Chip tone={order.payment.verified ? "green" : "gold"}>
              {order.payment.verified ? "Verified" : "Unverified"}
            </Chip>
            <Btn kind="ghost" className="!py-1 !px-2 text-xs"
              onClick={() => adminUpdate({ token, id, patch: { paymentVerified: !order.payment.verified } })}>
              {order.payment.verified ? "Mark unverified" : "Mark verified"}
            </Btn>
          </div>
          {order.payment.method === "bkash" && (
            <p className="text-muted mt-2">
              Number: {order.payment.bkashNumber || "—"} · TrxID: {order.payment.bkashTrxId || "—"}
            </p>
          )}
        </section>

        <section>
          <h3 className="serif mb-2">Courier</h3>
          <div className="grid grid-cols-2 gap-2">
            <input className={inputCls} placeholder="Courier name" value={cName} onChange={(e) => setCourierName(e.target.value)} />
            <input className={inputCls} placeholder="Tracking ID" value={cTrack} onChange={(e) => setTrackingId(e.target.value)} />
          </div>
          <Btn kind="ghost" className="mt-2"
            onClick={() => adminUpdate({ token, id, patch: { courier: { name: cName, trackingId: cTrack } } })}>
            Save courier
          </Btn>
        </section>

        {order.status === "returned" && (
          <section>
            <h3 className="serif mb-2">Return reason</h3>
            <textarea className={inputCls} rows={2} value={rReason} onChange={(e) => setReturnReason(e.target.value)} />
            <Btn kind="ghost" className="mt-2" onClick={() => adminUpdate({ token, id, patch: { returnReason: rReason } })}>
              Save reason
            </Btn>
          </section>
        )}

        <section>
          <h3 className="serif mb-2">Internal notes</h3>
          <textarea className={inputCls} rows={3} value={iNotes} onChange={(e) => setNotes(e.target.value)} />
          <Btn kind="ghost" className="mt-2" onClick={() => adminUpdate({ token, id, patch: { internalNotes: iNotes } })}>
            Save notes
          </Btn>
        </section>

        <section>
          <h3 className="serif mb-2">History</h3>
          <ol className="space-y-1">
            {order.statusHistory.map((h, i) => (
              <li key={i} className="flex justify-between text-muted">
                <span><span className="inline-block w-1.5 h-1.5 rounded-full bg-gold mr-2" />{h.status}</span>
                <span className="text-xs">{fmtDate(h.at)}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </Drawer>
  );
}

function Orders() {
  const token = useAdminToken();
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Id<"orders"> | null>(null);
  const orders = useQuery(api.orders.adminList, { token, status: tab, search: search || undefined });
  const updateStatus = useMutation(api.orders.updateStatus);

  return (
    <div>
      <PageHead title="Orders" sub="Manage and fulfil customer orders" />
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-3 py-1.5 text-sm rounded-sm capitalize ${tab === t ? "bg-ink text-cream" : "hairline text-charcoal hover:bg-white"}`}>
            {t}
          </button>
        ))}
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search order no, name, phone…"
          className={inputCls + " !w-64 ml-auto"}
        />
      </div>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-muted hairline-b">
                <th className="px-4 py-2 font-normal">Order</th>
                <th className="px-2 py-2 font-normal">Date</th>
                <th className="px-2 py-2 font-normal">Customer</th>
                <th className="px-2 py-2 font-normal">Phone</th>
                <th className="px-2 py-2 font-normal">Total</th>
                <th className="px-2 py-2 font-normal">Payment</th>
                <th className="px-4 py-2 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {(orders ?? []).map((o) => (
                <tr key={o._id} onClick={() => setSelected(o._id)}
                  className="hairline-b last:border-b-0 hover:bg-cream cursor-pointer">
                  <td className="px-4 py-2.5 font-medium whitespace-nowrap">{o.orderNo}</td>
                  <td className="px-2 py-2.5 text-muted text-xs whitespace-nowrap">{fmtDate(o._creationTime)}</td>
                  <td className="px-2 py-2.5 whitespace-nowrap">{o.customer.name}</td>
                  <td className="px-2 py-2.5 text-muted whitespace-nowrap">{o.customer.phone}</td>
                  <td className="px-2 py-2.5 whitespace-nowrap">{fmtBDT(o.total)}</td>
                  <td className="px-2 py-2.5 whitespace-nowrap">
                    <span className="mr-1">{o.payment.method === "bkash" ? "bKash" : "COD"}</span>
                    {o.payment.verified && <Chip tone="green">✓</Chip>}
                  </td>
                  <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={o.status}
                      onChange={(e) => updateStatus({ token, id: o._id, status: e.target.value })}
                      className="text-xs hairline rounded-sm px-2 py-1 bg-white"
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
              {orders && orders.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-muted">No orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      {selected && <OrderDetail id={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

export default function Page() {
  return (
    <AdminShell>
      <Orders />
    </AdminShell>
  );
}
