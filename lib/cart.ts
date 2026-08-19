"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  price: number;
  qty: number;
  size: string;
  color?: string;
  image?: string | null;
  placeholderHue?: number;
};

type CartState = {
  items: CartItem[];
  drawerOpen: boolean;
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  remove: (productId: string, size: string) => void;
  setQty: (productId: string, size: string, qty: number) => void;
  clear: () => void;
  setDrawer: (open: boolean) => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      drawerOpen: false,
      add: (item, qty = 1) =>
        set((s) => {
          const idx = s.items.findIndex(
            (i) => i.productId === item.productId && i.size === item.size
          );
          if (idx >= 0) {
            const items = [...s.items];
            items[idx] = { ...items[idx], qty: items[idx].qty + qty };
            return { items, drawerOpen: true };
          }
          return { items: [...s.items, { ...item, qty }], drawerOpen: true };
        }),
      remove: (productId, size) =>
        set((s) => ({
          items: s.items.filter(
            (i) => !(i.productId === productId && i.size === size)
          ),
        })),
      setQty: (productId, size, qty) =>
        set((s) => ({
          items: s.items
            .map((i) =>
              i.productId === productId && i.size === size ? { ...i, qty } : i
            )
            .filter((i) => i.qty > 0),
        })),
      clear: () => set({ items: [] }),
      setDrawer: (open) => set({ drawerOpen: open }),
    }),
    { name: "luxe_cart_v2" }
  )
);

export const cartSubtotal = (items: CartItem[]) =>
  items.reduce((s, i) => s + i.price * i.qty, 0);
export const cartCount = (items: CartItem[]) =>
  items.reduce((s, i) => s + i.qty, 0);
