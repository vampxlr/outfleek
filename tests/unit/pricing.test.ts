import { describe, it, expect } from "vitest";
import {
  calcSubtotal,
  calcDiscount,
  calcDeliveryFee,
  calcTotal,
  freeDeliveryRemaining,
} from "../../lib/pricing";

describe("calcSubtotal", () => {
  it("returns 0 for an empty cart", () => {
    expect(calcSubtotal([])).toBe(0);
  });

  it("computes subtotal for a single item", () => {
    expect(calcSubtotal([{ price: 500, qty: 2 }])).toBe(1000);
  });

  it("computes subtotal for multiple items", () => {
    expect(
      calcSubtotal([
        { price: 500, qty: 2 },
        { price: 300, qty: 1 },
        { price: 100, qty: 3 },
      ])
    ).toBe(1000 + 300 + 300);
  });

  it("handles large quantities", () => {
    expect(calcSubtotal([{ price: 250, qty: 1000 }])).toBe(250000);
  });
});

describe("calcDiscount", () => {
  it("returns 0 when there is no promo", () => {
    expect(calcDiscount(1000, null)).toBe(0);
  });

  it("applies a percent discount, rounded", () => {
    // 10% of 999 = 99.9 -> rounds to 100
    expect(calcDiscount(999, { kind: "percent", value: 10 })).toBe(100);
  });

  it("applies a fixed discount", () => {
    expect(calcDiscount(1000, { kind: "fixed", value: 150 })).toBe(150);
  });

  it("caps a fixed discount at the subtotal (never negative total)", () => {
    expect(calcDiscount(100, { kind: "fixed", value: 500 })).toBe(100);
  });

  it("caps a percent discount at the subtotal", () => {
    // pathological but should still clamp
    expect(calcDiscount(100, { kind: "percent", value: 500 })).toBe(100);
  });

  it("never returns a negative discount", () => {
    expect(calcDiscount(100, { kind: "fixed", value: -50 })).toBe(0);
  });

  it("returns 0 when minOrder is not met", () => {
    expect(
      calcDiscount(500, { kind: "fixed", value: 50, minOrder: 1000 })
    ).toBe(0);
  });

  it("applies discount when minOrder is exactly met", () => {
    expect(
      calcDiscount(1000, { kind: "fixed", value: 50, minOrder: 1000 })
    ).toBe(50);
  });

  it("applies discount when minOrder is exceeded", () => {
    expect(
      calcDiscount(1500, { kind: "percent", value: 10, minOrder: 1000 })
    ).toBe(150);
  });
});

describe("calcDeliveryFee", () => {
  const base = {
    feeDhaka: 80,
    feeOutside: 130,
    freeThreshold: 2000,
  };

  it("charges the dhaka fee when below threshold", () => {
    expect(
      calcDeliveryFee({ ...base, subtotal: 1000, discount: 0, area: "dhaka" })
    ).toBe(80);
  });

  it("charges the outside fee when below threshold", () => {
    expect(
      calcDeliveryFee({ ...base, subtotal: 1000, discount: 0, area: "outside" })
    ).toBe(130);
  });

  it("is free at exactly the threshold (boundary: 2000)", () => {
    expect(
      calcDeliveryFee({ ...base, subtotal: 2000, discount: 0, area: "dhaka" })
    ).toBe(0);
  });

  it("charges a fee just below the threshold (boundary: 1999)", () => {
    expect(
      calcDeliveryFee({ ...base, subtotal: 1999, discount: 0, area: "dhaka" })
    ).toBe(80);
  });

  it("is free just above the threshold (boundary: 2001)", () => {
    expect(
      calcDeliveryFee({ ...base, subtotal: 2001, discount: 0, area: "outside" })
    ).toBe(0);
  });

  it("accounts for discount when checking the threshold", () => {
    // subtotal 2500 - discount 600 = 1900, below 2000 -> fee charged
    expect(
      calcDeliveryFee({
        ...base,
        subtotal: 2500,
        discount: 600,
        area: "dhaka",
      })
    ).toBe(80);
  });

  it("uses an override fee when below threshold", () => {
    expect(
      calcDeliveryFee({
        ...base,
        subtotal: 1000,
        discount: 0,
        area: "dhaka",
        override: 50,
      })
    ).toBe(50);
  });

  it("override does not defeat free delivery once threshold is met", () => {
    expect(
      calcDeliveryFee({
        ...base,
        subtotal: 2000,
        discount: 0,
        area: "dhaka",
        override: 50,
      })
    ).toBe(0);
  });

  it("override of 0 behaves like a valid fee (still below threshold)", () => {
    expect(
      calcDeliveryFee({
        ...base,
        subtotal: 500,
        discount: 0,
        area: "dhaka",
        override: 0,
      })
    ).toBe(0);
  });
});

describe("freeDeliveryRemaining", () => {
  it("returns remaining amount below threshold", () => {
    expect(freeDeliveryRemaining(1500, 2000)).toBe(500);
  });

  it("returns 0 exactly at threshold", () => {
    expect(freeDeliveryRemaining(2000, 2000)).toBe(0);
  });

  it("returns 0 above threshold (never negative)", () => {
    expect(freeDeliveryRemaining(2500, 2000)).toBe(0);
  });
});

describe("calcTotal (integration)", () => {
  const settings = {
    feeDhaka: 80,
    feeOutside: 130,
    freeThreshold: 2000,
  };

  it("computes a full order with no promo, dhaka delivery", () => {
    const result = calcTotal({
      items: [{ price: 500, qty: 2 }],
      promo: null,
      area: "dhaka",
      ...settings,
    });
    expect(result).toEqual({
      subtotal: 1000,
      discount: 0,
      deliveryFee: 80,
      total: 1080,
    });
  });

  it("computes a full order with a percent promo crossing free delivery", () => {
    const result = calcTotal({
      items: [{ price: 1000, qty: 2 }], // subtotal 2000
      promo: { kind: "percent", value: 10 }, // discount 200 -> net 1800
      area: "outside",
      ...settings,
    });
    expect(result).toEqual({
      subtotal: 2000,
      discount: 200,
      deliveryFee: 130,
      total: 1930,
    });
  });

  it("computes a full order that qualifies for free delivery", () => {
    const result = calcTotal({
      items: [{ price: 2500, qty: 1 }],
      promo: null,
      area: "dhaka",
      ...settings,
    });
    expect(result).toEqual({
      subtotal: 2500,
      discount: 0,
      deliveryFee: 0,
      total: 2500,
    });
  });

  it("respects a landing page delivery fee override", () => {
    const result = calcTotal({
      items: [{ price: 300, qty: 1 }],
      promo: null,
      area: "outside",
      override: 30,
      ...settings,
    });
    expect(result).toEqual({
      subtotal: 300,
      discount: 0,
      deliveryFee: 30,
      total: 330,
    });
  });

  it("handles an empty cart", () => {
    const result = calcTotal({
      items: [],
      promo: null,
      area: "dhaka",
      ...settings,
    });
    expect(result).toEqual({
      subtotal: 0,
      discount: 0,
      deliveryFee: 80,
      total: 80,
    });
  });
});
