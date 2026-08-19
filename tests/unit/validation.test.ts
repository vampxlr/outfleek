import { describe, it, expect } from "vitest";
import {
  isValidBDPhone,
  normalizeBDPhone,
  isValidSlug,
  generateOrderNo,
  validateCheckout,
} from "../../lib/validation";

describe("isValidBDPhone", () => {
  it.each(["013", "014", "015", "016", "017", "018", "019"])(
    "accepts valid prefix %s",
    (prefix) => {
      expect(isValidBDPhone(`${prefix}12345678`)).toBe(true);
    }
  );

  it.each(["011", "012"])("rejects invalid prefix %s", (prefix) => {
    expect(isValidBDPhone(`${prefix}12345678`)).toBe(false);
  });

  it("rejects a number that is too short", () => {
    expect(isValidBDPhone("017123456")).toBe(false);
  });

  it("rejects a number that is too long", () => {
    expect(isValidBDPhone("01712345678900")).toBe(false);
  });

  it("rejects letters", () => {
    expect(isValidBDPhone("017abcde678")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isValidBDPhone("")).toBe(false);
  });

  it("rejects numbers with spaces", () => {
    expect(isValidBDPhone("017 1234 5678")).toBe(false);
  });

  it("rejects numbers with dashes", () => {
    expect(isValidBDPhone("017-1234-5678")).toBe(false);
  });
});

describe("normalizeBDPhone", () => {
  it("converts a local 01XXXXXXXXX number to 8801XXXXXXXXX", () => {
    expect(normalizeBDPhone("01712345678")).toBe("8801712345678");
  });

  it("converts a 10-digit 1XXXXXXXXX number to 8801XXXXXXXXX", () => {
    expect(normalizeBDPhone("1712345678")).toBe("8801712345678");
  });

  it("leaves an already-880-prefixed number unchanged", () => {
    expect(normalizeBDPhone("8801712345678")).toBe("8801712345678");
  });

  it("strips spaces and dashes before normalizing", () => {
    expect(normalizeBDPhone("017-1234 5678")).toBe("8801712345678");
  });

  it("strips a leading plus sign", () => {
    expect(normalizeBDPhone("+8801712345678")).toBe("8801712345678");
  });
});

describe("isValidSlug", () => {
  it("accepts lowercase letters, digits, and hyphens", () => {
    expect(isValidSlug("summer-sale-2024")).toBe(true);
  });

  it("rejects uppercase letters", () => {
    expect(isValidSlug("Summer-Sale")).toBe(false);
  });

  it("rejects spaces", () => {
    expect(isValidSlug("summer sale")).toBe(false);
  });

  it("rejects underscores", () => {
    expect(isValidSlug("summer_sale")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isValidSlug("")).toBe(false);
  });
});

describe("generateOrderNo", () => {
  it("produces the LX-YYYYMMDD-NNNN format deterministically", () => {
    const d = new Date(2024, 0, 5); // Jan 5 2024
    expect(generateOrderNo(d, 1234)).toBe("LX-20240105-1234");
  });

  it("zero-pads single-digit month and day", () => {
    const d = new Date(2024, 2, 7); // March 7 2024
    expect(generateOrderNo(d, 42)).toBe("LX-20240307-42");
  });

  it("uses a different date correctly (December, day 31)", () => {
    const d = new Date(2025, 11, 31);
    expect(generateOrderNo(d, 9999)).toBe("LX-20251231-9999");
  });

  it("generates a plausible order number when no args are passed", () => {
    const no = generateOrderNo();
    expect(no).toMatch(/^LX-\d{8}-\d+$/);
  });
});

describe("validateCheckout", () => {
  const validCod = {
    name: "Rahim Uddin",
    phone: "01712345678",
    address: "House 12, Road 5, Dhanmondi",
    payment: "cod" as const,
  };

  it("passes for a fully valid COD form", () => {
    const result = validateCheckout(validCod);
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it("fails when name is missing", () => {
    const result = validateCheckout({ ...validCod, name: "" });
    expect(result.valid).toBe(false);
    expect(result.errors.name).toBeDefined();
  });

  it("fails when name is only whitespace", () => {
    const result = validateCheckout({ ...validCod, name: "   " });
    expect(result.valid).toBe(false);
    expect(result.errors.name).toBeDefined();
  });

  it("fails when phone is invalid", () => {
    const result = validateCheckout({ ...validCod, phone: "12345" });
    expect(result.valid).toBe(false);
    expect(result.errors.phone).toBeDefined();
  });

  it("fails when address is too short", () => {
    const result = validateCheckout({ ...validCod, address: "short" });
    expect(result.valid).toBe(false);
    expect(result.errors.address).toBeDefined();
  });

  it("passes when address is exactly 10 characters", () => {
    const result = validateCheckout({ ...validCod, address: "1234567890" });
    expect(result.valid).toBe(true);
  });

  it("requires bkashNumber and bkashTrxId when payment is bkash", () => {
    const result = validateCheckout({
      ...validCod,
      payment: "bkash",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.bkashNumber).toBeDefined();
    expect(result.errors.bkashTrxId).toBeDefined();
  });

  it("fails bkash payment with an invalid bkashNumber", () => {
    const result = validateCheckout({
      ...validCod,
      payment: "bkash",
      bkashNumber: "12345",
      bkashTrxId: "ABCDEF123",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.bkashNumber).toBeDefined();
  });

  it("fails bkash payment with a too-short bkashTrxId", () => {
    const result = validateCheckout({
      ...validCod,
      payment: "bkash",
      bkashNumber: "01712345678",
      bkashTrxId: "AB1",
    });
    expect(result.valid).toBe(false);
    expect(result.errors.bkashTrxId).toBeDefined();
  });

  it("passes a fully valid bkash form", () => {
    const result = validateCheckout({
      ...validCod,
      payment: "bkash",
      bkashNumber: "01712345678",
      bkashTrxId: "ABCDEF123",
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it("does not require bkash fields for COD payment even if absent", () => {
    const result = validateCheckout(validCod);
    expect(result.errors.bkashNumber).toBeUndefined();
    expect(result.errors.bkashTrxId).toBeUndefined();
  });
});
