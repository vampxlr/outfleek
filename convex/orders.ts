import { query, mutation, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { getSetting, requireAdmin, DEFAULT_SETTINGS } from "./lib";
import { calcDiscount, calcDeliveryFee } from "../lib/pricing";
import { isValidBDPhone, generateOrderNo } from "../lib/validation";

export const place = mutation({
  args: {
    customer: v.object({
      name: v.string(),
      phone: v.string(),
      address: v.string(),
      area: v.union(v.literal("dhaka"), v.literal("outside")),
      notes: v.optional(v.string()),
    }),
    items: v.array(
      v.object({
        productId: v.id("products"),
        qty: v.number(),
        size: v.string(),
        color: v.optional(v.string()),
      })
    ),
    payment: v.object({
      method: v.union(v.literal("cod"), v.literal("bkash")),
      bkashNumber: v.optional(v.string()),
      bkashTrxId: v.optional(v.string()),
    }),
    promoCode: v.optional(v.string()),
    landingSlug: v.optional(v.string()),
    priceOverride: v.optional(v.number()), // only honored for landing orders
    tracking: v.optional(
      v.object({
        eventId: v.string(),
        fbc: v.optional(v.string()),
        fbp: v.optional(v.string()),
        fbclid: v.optional(v.string()),
        utm: v.optional(v.any()),
        userAgent: v.optional(v.string()),
        sourceUrl: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    if (!isValidBDPhone(args.customer.phone)) {
      throw new Error("Invalid phone number");
    }
    if (args.items.length === 0) throw new Error("Cart is empty");

    // Resolve landing page (for overrides + stats)
    let landing = null;
    if (args.landingSlug) {
      landing = await ctx.db
        .query("landingPages")
        .withIndex("by_slug", (q) => q.eq("slug", args.landingSlug!))
        .unique();
    }

    // Validate stock, compute prices server-side
    let subtotal = 0;
    const items = [];
    for (const it of args.items) {
      const p = await ctx.db.get(it.productId);
      if (!p || !p.active) throw new Error("Product unavailable");
      const vi = p.variants.findIndex(
        (x) => x.size === it.size && (!it.color || x.color === it.color)
      );
      if (vi === -1) throw new Error(`Variant unavailable: ${p.name} ${it.size}`);
      if (p.variants[vi].stock < it.qty)
        throw new Error(`Out of stock: ${p.name} (${it.size})`);
      const variants = [...p.variants];
      variants[vi] = { ...variants[vi], stock: variants[vi].stock - it.qty };
      await ctx.db.patch(p._id, { variants });

      const unit =
        landing && landing.productId === p._id && landing.priceOverride != null
          ? landing.priceOverride
          : p.price;
      subtotal += unit * it.qty;
      items.push({
        productId: p._id,
        name: p.name,
        price: unit,
        qty: it.qty,
        size: it.size,
        color: it.color,
      });
    }

    // Promo
    let discount = 0;
    if (args.promoCode) {
      const code = await ctx.db
        .query("promoCodes")
        .withIndex("by_code", (q) => q.eq("code", args.promoCode!.toUpperCase()))
        .unique();
      if (
        code &&
        code.active &&
        (!code.expiresAt || code.expiresAt > Date.now()) &&
        (!code.maxUses || code.uses < code.maxUses) &&
        (!code.minOrder || subtotal >= code.minOrder)
      ) {
        discount = calcDiscount(subtotal, { kind: code.kind, value: code.value });
        await ctx.db.patch(code._id, { uses: code.uses + 1 });
      }
    }

    // Delivery fee
    const threshold = (await getSetting(
      ctx, "freeDeliveryThreshold", DEFAULT_SETTINGS.freeDeliveryThreshold
    )) as number;
    const feeDhaka = (await getSetting(
      ctx, "deliveryFeeDhaka", DEFAULT_SETTINGS.deliveryFeeDhaka
    )) as number;
    const feeOutside = (await getSetting(
      ctx, "deliveryFeeOutside", DEFAULT_SETTINGS.deliveryFeeOutside
    )) as number;
    const deliveryFee = calcDeliveryFee({
      subtotal,
      discount,
      area: args.customer.area,
      feeDhaka,
      feeOutside,
      freeThreshold: threshold,
      override: landing?.deliveryFeeOverride,
    });

    const total = subtotal - discount + deliveryFee;
    const no = generateOrderNo();

    const orderId = await ctx.db.insert("orders", {
      orderNo: no,
      status: "pending",
      customer: args.customer,
      items,
      subtotal,
      deliveryFee,
      discount,
      promoCode: args.promoCode,
      total,
      payment: {
        method: args.payment.method,
        bkashNumber: args.payment.bkashNumber,
        bkashTrxId: args.payment.bkashTrxId,
        verified: false,
      },
      source: {
        landingSlug: args.landingSlug,
        utm: args.tracking?.utm,
        fbclid: args.tracking?.fbclid,
        fbc: args.tracking?.fbc,
        fbp: args.tracking?.fbp,
      },
      statusHistory: [{ status: "pending", at: Date.now() }],
    });

    if (landing) {
      await ctx.db.patch(landing._id, {
        ordersCount: landing.ordersCount + 1,
      });
    }

    // Mark abandoned checkout converted if one exists for this phone
    const abandoned = await ctx.db
      .query("abandonedCheckouts")
      .withIndex("by_phone", (q) => q.eq("phone", args.customer.phone))
      .collect();
    for (const a of abandoned.filter((a) => !a.convertedOrderId)) {
      await ctx.db.patch(a._id, { convertedOrderId: orderId });
    }

    // Fire server-side Purchase (never blocks the order)
    await ctx.scheduler.runAfter(0, internal.capi.sendEvent, {
      eventName: "Purchase",
      eventId: args.tracking?.eventId ?? no,
      customer: {
        name: args.customer.name,
        phone: args.customer.phone,
        city: args.customer.area === "dhaka" ? "dhaka" : "",
      },
      customData: {
        value: total,
        currency: "BDT",
        content_ids: items.map((i) => String(i.productId)),
        content_type: "product",
        content_name: args.landingSlug ?? "store",
        num_items: items.reduce((s, i) => s + i.qty, 0),
      },
      fbc: args.tracking?.fbc,
      fbp: args.tracking?.fbp,
      userAgent: args.tracking?.userAgent,
      sourceUrl: args.tracking?.sourceUrl,
      attempt: 1,
    });

    return { orderNo: no, total, deliveryFee, discount, subtotal };
  },
});

export const saveAbandoned = mutation({
  args: {
    name: v.optional(v.string()),
    phone: v.string(),
    address: v.optional(v.string()),
    items: v.any(),
    total: v.number(),
    landingSlug: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (!isValidBDPhone(args.phone)) return;
    const existing = await ctx.db
      .query("abandonedCheckouts")
      .withIndex("by_phone", (q) => q.eq("phone", args.phone))
      .collect();
    const open = existing.find((a) => !a.convertedOrderId);
    if (open) {
      await ctx.db.patch(open._id, { ...args, contacted: open.contacted });
    } else {
      await ctx.db.insert("abandonedCheckouts", { ...args, contacted: false });
    }
  },
});

export const track = query({
  args: { orderNo: v.string(), phone: v.string() },
  handler: async (ctx, { orderNo, phone }) => {
    const order = await ctx.db
      .query("orders")
      .withIndex("by_orderNo", (q) => q.eq("orderNo", orderNo))
      .unique();
    if (!order || order.customer.phone !== phone) return null;
    return {
      orderNo: order.orderNo,
      status: order.status,
      statusHistory: order.statusHistory,
      items: order.items.map((i) => ({ name: i.name, qty: i.qty, size: i.size })),
      total: order.total,
      courier: order.courier,
      createdAt: order._creationTime,
    };
  },
});

// ---------- Admin ----------

export const adminList = query({
  args: {
    token: v.string(),
    status: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, { token, status, search }) => {
    await requireAdmin(ctx, token);
    let orders = await ctx.db.query("orders").order("desc").take(500);
    if (status && status !== "all")
      orders = orders.filter((o) => o.status === status);
    if (search) {
      const s = search.toLowerCase();
      orders = orders.filter(
        (o) =>
          o.orderNo.toLowerCase().includes(s) ||
          o.customer.phone.includes(s) ||
          o.customer.name.toLowerCase().includes(s)
      );
    }
    return orders;
  },
});

export const adminGet = query({
  args: { token: v.string(), id: v.id("orders") },
  handler: async (ctx, { token, id }) => {
    await requireAdmin(ctx, token);
    return await ctx.db.get(id);
  },
});

export const updateStatus = mutation({
  args: { token: v.string(), id: v.id("orders"), status: v.string() },
  handler: async (ctx, { token, id, status }) => {
    await requireAdmin(ctx, token);
    const order = await ctx.db.get(id);
    if (!order) throw new Error("Not found");
    await ctx.db.patch(id, {
      status: status as any,
      statusHistory: [...order.statusHistory, { status, at: Date.now() }],
    });
    // Optimization signal: confirmed COD order → custom server event
    if (status === "confirmed") {
      await ctx.scheduler.runAfter(0, internal.capi.sendEvent, {
        eventName: "PhoneConfirmed",
        eventId: `${order.orderNo}-confirmed`,
        customer: {
          name: order.customer.name,
          phone: order.customer.phone,
          city: order.customer.area === "dhaka" ? "dhaka" : "",
        },
        customData: { value: order.total, currency: "BDT" },
        fbc: order.source?.fbc,
        fbp: order.source?.fbp,
        attempt: 1,
      });
    }
    // Restock on cancel/return
    if (status === "cancelled" || status === "returned") {
      for (const it of order.items) {
        const p = await ctx.db.get(it.productId);
        if (!p) continue;
        const vi = p.variants.findIndex(
          (x) => x.size === it.size && (!it.color || x.color === it.color)
        );
        if (vi === -1) continue;
        const variants = [...p.variants];
        variants[vi] = { ...variants[vi], stock: variants[vi].stock + it.qty };
        await ctx.db.patch(p._id, { variants });
      }
    }
  },
});

export const adminUpdate = mutation({
  args: {
    token: v.string(),
    id: v.id("orders"),
    patch: v.object({
      internalNotes: v.optional(v.string()),
      returnReason: v.optional(v.string()),
      courier: v.optional(
        v.object({ name: v.string(), trackingId: v.string() })
      ),
      paymentVerified: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, { token, id, patch }) => {
    await requireAdmin(ctx, token);
    const order = await ctx.db.get(id);
    if (!order) throw new Error("Not found");
    const update: any = {};
    if (patch.internalNotes !== undefined) update.internalNotes = patch.internalNotes;
    if (patch.returnReason !== undefined) update.returnReason = patch.returnReason;
    if (patch.courier !== undefined) update.courier = patch.courier;
    if (patch.paymentVerified !== undefined)
      update.payment = {
        ...order.payment,
        verified: patch.paymentVerified,
        paidAt: patch.paymentVerified ? Date.now() : undefined,
      };
    await ctx.db.patch(id, update);
  },
});

export const abandonedList = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireAdmin(ctx, token);
    return (await ctx.db.query("abandonedCheckouts").order("desc").take(200)).filter(
      (a) => !a.convertedOrderId
    );
  },
});

export const markContacted = mutation({
  args: { token: v.string(), id: v.id("abandonedCheckouts") },
  handler: async (ctx, { token, id }) => {
    await requireAdmin(ctx, token);
    await ctx.db.patch(id, { contacted: true });
  },
});

export const dashboard = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    await requireAdmin(ctx, token);
    const orders = await ctx.db.query("orders").order("desc").take(1000);
    const now = Date.now();
    const day = 86400000;
    const bucket = (since: number) => {
      const list = orders.filter((o) => o._creationTime >= since);
      const active = list.filter(
        (o) => o.status !== "cancelled" && o.status !== "returned"
      );
      return {
        orders: list.length,
        revenue: active.reduce((s, o) => s + o.total, 0),
      };
    };
    const abandoned = (
      await ctx.db.query("abandonedCheckouts").order("desc").take(200)
    ).filter((a) => !a.convertedOrderId && !a.contacted).length;
    const landings = await ctx.db.query("landingPages").collect();
    return {
      today: bucket(now - day),
      week: bucket(now - 7 * day),
      month: bucket(now - 30 * day),
      pendingCount: orders.filter((o) => o.status === "pending").length,
      abandonedCount: abandoned,
      recent: orders.slice(0, 10),
      landingStats: landings.map((l) => ({
        slug: l.slug,
        title: l.title,
        status: l.status,
        views: l.views,
        initiates: l.initiates,
        orders: l.ordersCount,
        cvr: l.views ? Math.round((l.ordersCount / l.views) * 1000) / 10 : 0,
      })),
    };
  },
});
