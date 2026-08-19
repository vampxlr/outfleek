"use node";
import { internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal, api } from "./_generated/api";
import { createHash } from "crypto";
import { normalizeBDPhone } from "../lib/validation";

function sha256(s: string) {
  return createHash("sha256").update(s).digest("hex");
}

export const sendEvent = internalAction({
  args: {
    eventName: v.string(),
    eventId: v.string(),
    customer: v.optional(
      v.object({
        name: v.optional(v.string()),
        phone: v.optional(v.string()),
        city: v.optional(v.string()),
      })
    ),
    customData: v.optional(v.any()),
    fbc: v.optional(v.string()),
    fbp: v.optional(v.string()),
    clientIp: v.optional(v.string()),
    userAgent: v.optional(v.string()),
    sourceUrl: v.optional(v.string()),
    attempt: v.number(),
  },
  handler: async (ctx, args): Promise<void> => {
    const settings: any = await ctx.runQuery(api.settings.publicSettings, {});
    const pixelId = settings.pixelId as string;
    // capiToken is secret — read from settings table via internal helper
    const token: string = await ctx.runQuery(internal.capiHelpers.readToken, {});
    if (!pixelId || !token) {
      await ctx.runMutation(internal.capiHelpers.log, {
        eventName: args.eventName,
        eventId: args.eventId,
        status: "error",
        responseSummary: "Skipped: pixelId or CAPI token not configured",
        attempt: args.attempt,
      });
      return;
    }

    const user_data: Record<string, unknown> = {};
    if (args.customer?.phone) {
      const ph = sha256(normalizeBDPhone(args.customer.phone));
      user_data.ph = [ph];
      user_data.external_id = [ph];
    }
    if (args.customer?.name) {
      const parts = args.customer.name.trim().toLowerCase().split(/\s+/);
      user_data.fn = [sha256(parts[0])];
      if (parts.length > 1) user_data.ln = [sha256(parts[parts.length - 1])];
    }
    if (args.customer?.city) user_data.ct = [sha256(args.customer.city)];
    user_data.country = [sha256("bd")];
    if (args.fbc) user_data.fbc = args.fbc;
    if (args.fbp) user_data.fbp = args.fbp;
    if (args.clientIp) user_data.client_ip_address = args.clientIp;
    if (args.userAgent) user_data.client_user_agent = args.userAgent;

    const body: Record<string, unknown> = {
      data: [
        {
          event_name: args.eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: args.eventId,
          action_source: "website",
          event_source_url: args.sourceUrl,
          user_data,
          custom_data: args.customData ?? undefined,
        },
      ],
    };
    if (settings.testModeEnabled && settings.testEventCode) {
      body.test_event_code = settings.testEventCode;
    }

    try {
      const res = await fetch(
        `https://graph.facebook.com/v21.0/${pixelId}/events?access_token=${encodeURIComponent(token)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const json = await res.json();
      if (!res.ok) throw new Error(JSON.stringify(json).slice(0, 500));
      await ctx.runMutation(internal.capiHelpers.log, {
        eventName: args.eventName,
        eventId: args.eventId,
        status: "ok",
        responseSummary: JSON.stringify(json).slice(0, 300),
        attempt: args.attempt,
      });
    } catch (e: any) {
      await ctx.runMutation(internal.capiHelpers.log, {
        eventName: args.eventName,
        eventId: args.eventId,
        status: args.attempt >= 3 ? "error" : "retry",
        responseSummary: String(e?.message ?? e).slice(0, 300),
        attempt: args.attempt,
      });
      if (args.attempt < 3) {
        await ctx.scheduler.runAfter(
          60_000 * args.attempt,
          internal.capi.sendEvent,
          { ...args, attempt: args.attempt + 1 }
        );
      }
    }
  },
});
