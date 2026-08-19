import { describe, it, expect, beforeEach } from "vitest";
import { useCart, cartSubtotal, cartCount, type CartItem } from "../../lib/cart";

const baseItem: Omit<CartItem, "qty"> = {
  productId: "p1",
  slug: "classic-tee",
  name: "Classic Tee",
  price: 500,
  size: "M",
};

function resetStore() {
  useCart.setState({ items: [], drawerOpen: false });
}

describe("useCart store", () => {
  beforeEach(() => {
    resetStore();
  });

  it("adds a new item to an empty cart", () => {
    useCart.getState().add(baseItem);
    const { items } = useCart.getState();
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ ...baseItem, qty: 1 });
  });

  it("opens the drawer when an item is added", () => {
    useCart.getState().add(baseItem);
    expect(useCart.getState().drawerOpen).toBe(true);
  });

  it("increments qty when adding a duplicate productId+size", () => {
    useCart.getState().add(baseItem, 1);
    useCart.getState().add(baseItem, 2);
    const { items } = useCart.getState();
    expect(items).toHaveLength(1);
    expect(items[0].qty).toBe(3);
  });

  it("creates a separate line for the same product with a different size", () => {
    useCart.getState().add(baseItem, 1);
    useCart.getState().add({ ...baseItem, size: "L" }, 1);
    const { items } = useCart.getState();
    expect(items).toHaveLength(2);
    expect(items.map((i) => i.size).sort()).toEqual(["L", "M"]);
  });

  it("setQty updates the quantity of a matching line", () => {
    useCart.getState().add(baseItem, 1);
    useCart.getState().setQty(baseItem.productId, baseItem.size, 5);
    expect(useCart.getState().items[0].qty).toBe(5);
  });

  it("setQty to 0 removes the line", () => {
    useCart.getState().add(baseItem, 1);
    useCart.getState().setQty(baseItem.productId, baseItem.size, 0);
    expect(useCart.getState().items).toHaveLength(0);
  });

  it("remove deletes the matching productId+size line only", () => {
    useCart.getState().add(baseItem, 1);
    useCart.getState().add({ ...baseItem, size: "L" }, 1);
    useCart.getState().remove(baseItem.productId, "M");
    const { items } = useCart.getState();
    expect(items).toHaveLength(1);
    expect(items[0].size).toBe("L");
  });

  it("clear empties the cart", () => {
    useCart.getState().add(baseItem, 1);
    useCart.getState().add({ ...baseItem, size: "L" }, 1);
    useCart.getState().clear();
    expect(useCart.getState().items).toHaveLength(0);
  });

  it("cartSubtotal sums price * qty across lines", () => {
    const items: CartItem[] = [
      { ...baseItem, qty: 2 },
      { ...baseItem, size: "L", qty: 1, price: 600 },
    ];
    expect(cartSubtotal(items)).toBe(500 * 2 + 600 * 1);
  });

  it("cartCount sums quantities across lines", () => {
    const items: CartItem[] = [
      { ...baseItem, qty: 2 },
      { ...baseItem, size: "L", qty: 3 },
    ];
    expect(cartCount(items)).toBe(5);
  });

  it("cartSubtotal and cartCount are 0 for an empty cart", () => {
    expect(cartSubtotal([])).toBe(0);
    expect(cartCount([])).toBe(0);
  });
});
