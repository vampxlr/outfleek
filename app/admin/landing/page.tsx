"use client";
import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import AdminShell from "@/components/admin/AdminShell";
import { useAdminToken } from "@/components/admin/useAdminToken";
import { PageHead, Card, Chip, Btn } from "@/components/admin/ui";

function LandingList() {
  const token = useAdminToken();
  const pages = useQuery(api.landingPages.adminList, { token });
  const duplicate = useMutation(api.landingPages.duplicate);
  const remove = useMutation(api.landingPages.remove);
  const [copied, setCopied] = useState<string | null>(null);

  const copyUrl = (slug: string) => {
    navigator.clipboard.writeText(`${location.origin}/l/${slug}`);
    setCopied(slug);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div>
      <PageHead
        title="Landing Pages"
        sub="High-converting single-product pages"
        actions={
          <Link href="/admin/landing/edit?id=new">
            <Btn>+ New page</Btn>
          </Link>
        }
      />
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-muted hairline-b">
                <th className="px-4 py-2 font-normal">Title</th>
                <th className="px-2 py-2 font-normal">Slug</th>
                <th className="px-2 py-2 font-normal">Product</th>
                <th className="px-2 py-2 font-normal">Status</th>
                <th className="px-2 py-2 font-normal">Views</th>
                <th className="px-2 py-2 font-normal">Initiates</th>
                <th className="px-2 py-2 font-normal">Orders</th>
                <th className="px-2 py-2 font-normal">CVR</th>
                <th className="px-4 py-2 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {(pages ?? []).map((p: any) => (
                <tr key={p._id} className="hairline-b last:border-b-0 hover:bg-cream">
                  <td className="px-4 py-2.5 font-medium whitespace-nowrap">{p.title}</td>
                  <td className="px-2 py-2.5 whitespace-nowrap">
                    <button onClick={() => copyUrl(p.slug)} className="text-gold-dark underline text-xs" title="Copy URL">
                      /l/{p.slug} {copied === p.slug ? "✓" : "⧉"}
                    </button>
                  </td>
                  <td className="px-2 py-2.5 text-muted whitespace-nowrap">{p.productName}</td>
                  <td className="px-2 py-2.5"><Chip tone={p.status === "published" ? "green" : "neutral"}>{p.status}</Chip></td>
                  <td className="px-2 py-2.5">{p.views}</td>
                  <td className="px-2 py-2.5">{p.initiates}</td>
                  <td className="px-2 py-2.5">{p.ordersCount}</td>
                  <td className="px-2 py-2.5">{p.views ? Math.round((p.ordersCount / p.views) * 1000) / 10 : 0}%</td>
                  <td className="px-4 py-2.5 text-right whitespace-nowrap">
                    <Link href={`/admin/landing/edit?id=${p._id}`} className="text-xs hairline px-2 py-1 rounded-sm mr-2 hover:bg-white">
                      Edit
                    </Link>
                    <Btn kind="ghost" className="!py-1 !px-2 text-xs mr-2" onClick={() => duplicate({ token, id: p._id })}>
                      Duplicate
                    </Btn>
                    <Btn kind="danger" className="!py-1 !px-2 text-xs"
                      onClick={() => { if (confirm(`Delete "${p.title}"?`)) remove({ token, id: p._id }); }}>
                      Delete
                    </Btn>
                  </td>
                </tr>
              ))}
              {pages && pages.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-muted">No landing pages yet.</td></tr>
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
      <LandingList />
    </AdminShell>
  );
}
