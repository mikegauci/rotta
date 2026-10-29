import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { env } from "@/lib/env";
import "./globals.css";
import { CartProvider } from "@/components/shop/cart";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.siteUrl),
  title: {
    default: "Rotta | Sharing a Passion",
    template: "%s - Rotta",
  },
  description: "Celebrating Malta's Automotive Community",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
