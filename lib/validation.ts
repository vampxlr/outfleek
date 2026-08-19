/**
 * Pure validation/formatting helpers shared by the Convex backend and the
 * client checkout form. No React/browser/Convex dependencies.
 */

/** Bangladeshi mobile number: 11 digits, starting 01[3-9]. */
const BD_PHONE_RE = /^01[3-9]\d{8}$/;

/** Landing page slug: lowercase letters, digits, hyphens only. */
const SLUG_RE = /^[a-z0-9-]+$/;

/**
 * True when `phone` is a valid local-format Bangladeshi mobile number
 * (e.g. "01712345678"). Does not accept spaces/dashes/country code —
 * use with a normalized string, or see normalizeBDPhone.
 */
export function isValidBDPhone(phone: string): boolean {
  return BD_PHONE_RE.test(phone);
}

/**
 * Normalizes a Bangladeshi phone number to E.164-ish "8801XXXXXXXXX" form.
 * - Strips all non-digit characters first (spaces, dashes, +).
 * - "01XXXXXXXXX" (starts with 01)              -> "8801XXXXXXXXX"
 * - "1XXXXXXXXX" (10 digits, starts with 1)      -> "8801XXXXXXXXX"
 * - Already-"880..."-prefixed numbers are left unchanged.
 * - Anything else is returned digits-only, unchanged.
 * Mirrors the normalization previously inlined in convex/capi.ts.
 */
export function normalizeBDPhone(phone: string): string {
  let p = phone.replace(/\D/g, "");
  if (p.startsWith("01")) p = "88" + p;
  if (p.startsWith("1") && p.length === 10) p = "880" + p;
  return p;
}

/** True when `slug` contains only lowercase letters, digits, and hyphens. */
export function isValidSlug(slug: string): boolean {
  return SLUG_RE.test(slug);
}

/**
 * Generates an order number in the form "LX-YYYYMMDD-NNNN".
 * Deterministic when `date` and/or `rand` are supplied (useful for tests);
 * defaults to the current date and a random 4-digit number otherwise.
 */
export function generateOrderNo(date?: Date, rand?: number): string {
  const d = date ?? new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(
    d.getDate()
  ).padStart(2, "0")}`;
  const n = rand ?? Math.floor(1000 + Math.random() * 9000);
  return `LX-${ymd}-${n}`;
}

export type CheckoutForm = {
  name: string;
  phone: string;
  address: string;
  payment: "cod" | "bkash";
  bkashNumber?: string;
  bkashTrxId?: string;
};

export type ValidationResult = {
  valid: boolean;
  errors: Record<string, string>;
};

/**
 * Validates a checkout form. Rules:
 * - name: required (non-empty after trim)
 * - phone: required and must be a valid BD phone number
 * - address: required, minimum 10 characters (after trim)
 * - when payment === "bkash": bkashNumber must be a valid BD phone, and
 *   bkashTrxId must be non-empty and at least 6 characters (after trim)
 */
export function validateCheckout(form: CheckoutForm): ValidationResult {
  const errors: Record<string, string> = {};

  if (!form.name || !form.name.trim()) {
    errors.name = "Name is required";
  }

  if (!form.phone || !isValidBDPhone(form.phone)) {
    errors.phone = "Enter a valid Bangladeshi phone number";
  }

  if (!form.address || form.address.trim().length < 10) {
    errors.address = "Address must be at least 10 characters";
  }

  if (form.payment === "bkash") {
    if (!form.bkashNumber || !isValidBDPhone(form.bkashNumber)) {
      errors.bkashNumber = "Enter a valid bKash number";
    }
    if (!form.bkashTrxId || form.bkashTrxId.trim().length < 6) {
      errors.bkashTrxId = "Enter a valid Transaction ID";
    }
  }

  return { valid: Object.keys(errors).length === 0, errors };
}
