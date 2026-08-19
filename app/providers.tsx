"use client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { captureClickIds, initPixel, firePixel } from "@/lib/tracking";
import { usePathname } from "next/navigation";

function Tracking({ children }: { children: ReactNode }) {
  const settings = useQuery(api.settings.publicSettings, {});
  const mirror = useMutation(api.capiHelpers.mirrorEvent);
  const pathname = usePathname();

  useEffect(() => {
    captureClickIds();
  }, []);

  useEffect(() => {
    if (!settings?.pixelId) return;
    initPixel(settings.pixelId as string);
    const { eventId, fbc, fbp, userAgent, sourceUrl } = firePixel("PageView");
    mirror({ eventName: "PageView", eventId, fbc, fbp, userAgent, sourceUrl }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings?.pixelId, pathname]);

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  const client = useMemo(
    () => new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL as string),
    []
  );
  return (
    <ConvexProvider client={client}>
      <Tracking>{children}</Tracking>
    </ConvexProvider>
  );
}
