import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";
import { env } from "@/lib/env";
import "./globals.css";
import { CartProvider } from "@/components/shop/cart";
import { GA_MEASUREMENT_ID, isLiveSite } from "@/lib/seo";

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
  openGraph: {
    siteName: "Rotta",
    locale: "en_US",
    type: "website",
    images: ["/brand/og-default.jpg"],
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${poppins.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <CartProvider>{children}</CartProvider>
        {isLiveSite && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4" strategy="afterInteractive">
              {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${GA_MEASUREMENT_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
