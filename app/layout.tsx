import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "LUXE TEES — Premium T-Shirts, Bangladesh",
  description:
    "Premium cotton t-shirts delivered anywhere in Bangladesh. Cash on Delivery & bKash accepted.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
