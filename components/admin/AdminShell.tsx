"use client";
import { ReactNode, useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { motion } from "framer-motion";
import { AdminTokenContext } from "./useAdminToken";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/abandoned", label: "Abandoned" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/landing", label: "Landing Pages" },
  { href: "/admin/promos", label: "Promo Codes" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/tracking", label: "Tracking Debug" },
];

function Login({ onToken }: { onToken: (t: string) => void }) {
  const login = useMutation(api.auth.login);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const { token } = await login({ password });
      localStorage.setItem("admin_token", token);
      onToken(token);
    } catch {
      setError("Wrong password");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream p-4">
      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white hairline rounded-sm p-8 w-full max-w-sm"
      >
        <h1 className="serif text-2xl mb-1">Admin</h1>
        <p className="text-sm text-muted mb-6">Sign in to manage the store.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="w-full px-3 py-2 text-sm hairline rounded-sm outline-none focus:border-gold mb-3"
        />
        {error && <p className="text-sm text-red-700 mb-3">{error}</p>}
        <button
          type="submit"
          disabled={busy || !password}
          className="w-full py-2 bg-ink text-cream text-sm rounded-sm hover:bg-charcoal disabled:opacity-50"
        >
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </motion.form>
    </div>
  );
}

export default function AdminShell({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const pathname = usePathname();
  const logout = useMutation(api.auth.logout);

  useEffect(() => {
    setToken(localStorage.getItem("admin_token"));
    setLoaded(true);
  }, []);

  const valid = useQuery(api.auth.check, token ? { token } : "skip");

  if (!loaded) return null;
  if (!token || valid === false) {
    if (token && valid === false) localStorage.removeItem("admin_token");
    return <Login onToken={setToken} />;
  }
  if (valid === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream text-muted text-sm">
        Loading…
      </div>
    );
  }

  const doLogout = async () => {
    try { await logout({ token }); } catch {}
    localStorage.removeItem("admin_token");
    setToken(null);
  };

  const nav = (
    <nav className="flex flex-col gap-1 p-3">
      {NAV.map((n) => {
        const active = n.href === "/admin" ? pathname === "/admin" : pathname.startsWith(n.href);
        return (
          <Link
            key={n.href}
            href={n.href}
            onClick={() => setNavOpen(false)}
            className={`px-3 py-2 text-sm rounded-sm transition-colors ${
              active ? "bg-ink text-cream" : "text-charcoal hover:bg-cream"
            }`}
          >
            {n.label}
          </Link>
        );
      })}
      <button
        onClick={doLogout}
        className="mt-4 px-3 py-2 text-sm text-left text-muted hover:text-ink rounded-sm hairline-t pt-4"
      >
        Log out
      </button>
    </nav>
  );

  return (
    <AdminTokenContext.Provider value={token}>
      <div className="min-h-screen bg-cream flex print:block">
        {/* Sidebar desktop */}
        <aside className="hidden md:flex flex-col w-56 shrink-0 bg-white hairline sticky top-0 h-screen print:hidden">
          <div className="px-5 py-5 hairline-b">
            <span className="serif text-lg">LUXE TEES</span>
            <span className="block text-xs text-gold-dark tracking-widest uppercase mt-0.5">Admin</span>
          </div>
          {nav}
        </aside>

        {/* Mobile header */}
        <div className="md:hidden fixed top-0 inset-x-0 z-40 bg-white hairline-b flex items-center justify-between px-4 py-3 print:hidden">
          <span className="serif">LUXE TEES · Admin</span>
          <button onClick={() => setNavOpen(!navOpen)} className="text-sm hairline px-3 py-1 rounded-sm">
            Menu
          </button>
        </div>
        {navOpen && (
          <div className="md:hidden fixed inset-0 z-30 bg-ink/30" onClick={() => setNavOpen(false)}>
            <div className="absolute top-12 inset-x-0 bg-white hairline-b" onClick={(e) => e.stopPropagation()}>
              {nav}
            </div>
          </div>
        )}

        <motion.main
          key={pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 min-w-0 p-4 md:p-8 pt-16 md:pt-8 print:p-0"
        >
          {children}
        </motion.main>
      </div>
    </AdminTokenContext.Provider>
  );
}
