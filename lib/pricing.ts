/**
 * Pure pricing/checkout math shared by the Convex backend and the client.
 * No React/browser/Convex dependencies — safe to import from anywhere.
 */

export type CartLine = { price: number; qty: number };

export type Promo = {
  kind: "percent" | "fixed";
  value: number;
  minOrder?: number;
};

export type DeliveryOpts = {
  subtotal: number;
  discount: number;
  area: "dhaka" | "outside";
  feeDhaka: number;
  feeOutside: number;
  freeThreshold: number;
  /** Optional fee override (e.g. a landing page's custom delivery fee). */
  override?: number;
};

export type TotalOpts = {
  items: CartLine[];
  promo: Promo | null;
  area: "dhaka" | "outside";
  feeDhaka: number;
  feeOutside: number;
  freeThreshold: number;
  override?: number;
};

export type TotalResult = {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
};

/**
 * Sum of price * qty across all cart lines.
 * Returns 0 for an empty cart.
 */
export function calcSubtotal(items: CartLine[]): number {
  return items.reduce((sum, i) => sum + i.price * i.qty, 0);
}

/**
 * Computes the discount amount for a promo code applied to a subtotal.
 * - Returns 0 when there is no promo, or the promo's minOrder isn't met.
 * - Percent discounts are rounded with Math.round.
 * - The result is always clamped to [0, subtotal] — never negative, never
 *   larger than the subtotal itself.
 */
export function calcDiscount(subtotal: number, promo: Promo | null): number {
  if (!promo) return 0;
  if (promo.minOrder && subtotal < promo.minOrder) return 0;

  const raw =
    promo.kind === "percent"
      ? Math.round((subtotal * promo.value) / 100)
      : promo.value;

  return Math.max(0, Math.min(raw, subtotal));
}

/**
 * Computes the delivery fee.
 * - Free (0) once (subtotal - discount) >= freeThreshold.
 * - Otherwise an explicit `override` wins over the area-based fee.
 * - Otherwise falls back to feeDhaka / feeOutside based on `area`.
 */
export function calcDeliveryFee(opts: DeliveryOpts): number {
  const { subtotal, discount, area, feeDhaka, feeOutside, freeThreshold, override } =
    opts;
  if (subtotal - discount >= freeThreshold) return 0;
  if (override != null) return override;
  return area === "dhaka" ? feeDhaka : feeOutside;
}

/**
 * How much more the customer needs to spend (before discount) to unlock
 * free delivery. Returns 0 if already at/above the threshold.
 */
export function freeDeliveryRemaining(subtotal: number, threshold: number): number {
  return Math.max(0, threshold - subtotal);
}

/**
 * End-to-end order total calculation combining subtotal, discount, and
 * delivery fee — the single source of truth used both server-side (Convex
 * mutations) and client-side (checkout UI preview).
 */
export function calcTotal(opts: TotalOpts): TotalResult {
  const subtotal = calcSubtotal(opts.items);
  const discount = calcDiscount(subtotal, opts.promo);
  const deliveryFee = calcDeliveryFee({
    subtotal,
    discount,
    area: opts.area,
    feeDhaka: opts.feeDhaka,
    feeOutside: opts.feeOutside,
    freeThreshold: opts.freeThreshold,
    override: opts.override,
  });
  const total = subtotal - discount + deliveryFee;
  return { subtotal, discount, deliveryFee, total };
}
