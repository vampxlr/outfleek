"use client";
// Meta Pixel + CAPI mirroring with strict dedup:
// ONE eventId per real event, sent to BOTH the browser Pixel and (via Convex) CAPI.

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
    _fbq?: any;
  }
}

export function uuid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function readCookie(name: string): string | undefined {
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : undefined;
}

// Capture fbclid on landing → first-party _fbc cookie (Meta format).
// Biggest EMQ lever for a COD store. Also persist UTMs for order attribution.
export function captureClickIds() {
  try {
    const params = new URLSearchParams(window.location.search);
    const fbclid = params.get("fbclid");
    if (fbclid && !readCookie("_fbc")) {
      const fbc = `fb.1.${Date.now()}.${fbclid}`;
      document.cookie = `_fbc=${encodeURIComponent(fbc)}; path=/; max-age=${90 * 86400}; SameSite=Lax`;
    }
    if (fbclid) sessionStorage.setItem("fbclid", fbclid);
    const utm: Record<string, string> = {};
    for (const k of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
      const val = params.get(k);
      if (val) utm[k] = val;
    }
    if (Object.keys(utm).length)
      sessionStorage.setItem("utm", JSON.stringify(utm));
  } catch {}
}

export function getTrackingContext() {
  let utm: any = undefined;
  try {
    const raw = sessionStorage.getItem("utm");
    if (raw) utm = JSON.parse(raw);
  } catch {}
  return {
    fbc: readCookie("_fbc"),
    fbp: readCookie("_fbp"),
    fbclid: sessionStorage.getItem("fbclid") ?? undefined,
    utm,
    userAgent: navigator.userAgent,
    sourceUrl: window.location.href,
  };
}

export function initPixel(pixelId: string) {
  if (!pixelId || window.fbq) return;
  /* eslint-disable */
  (function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n; n.loaded = true; n.version = "2.0"; n.queue = [];
    t = b.createElement(e); t.async = true; t.src = v;
    s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */
  window.fbq!("init", pixelId);
}

export type StdEvent =
  | "PageView"
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "AddPaymentInfo";

// Fire browser Pixel with eventID; returns the eventId + context so the caller
// can mirror to CAPI (Convex mutation) with the SAME id.
export function firePixel(event: StdEvent, customData?: Record<string, unknown>) {
  const eventId = uuid();
  if (window.fbq) {
    window.fbq("track", event, customData ?? {}, { eventID: eventId });
  }
  return { eventId, ...getTrackingContext(), customData };
}
