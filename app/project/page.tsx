import type { Metadata } from "next";
import ProjectHub from "./ProjectHub";

// Unlisted page: reachable only by direct URL, never linked from the store
// and explicitly excluded from search engines.
export const metadata: Metadata = {
  title: "Outfleek — Project Documentation",
  description:
    "Engineering and testing documentation for the Outfleek e-commerce platform.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export default function Page() {
  return <ProjectHub />;
}
