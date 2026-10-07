import type { Metadata } from "next";
import "./globals.css";
import ToastBridge from "./ToastBridge";

const description =
  "Regsure helps local and growing businesses keep stock, sales, customers, and weekly business rhythms in one calm, practical workspace, with a WhatsApp assistant for updates on the go.";

export const metadata: Metadata = {
  metadataBase: new URL("https://regsure.vercel.app/"),
  title: {
    default: "Regsure | Know your business by heart",
    template: "%s | Regsure",
  },
  description,
  applicationName: "Regsure",
  keywords: [
    "business bookkeeping",
    "inventory management",
    "sales analytics",
    "small business software",
    "WhatsApp business assistant",
  ],
  authors: [{ name: "Regsure" }],
  creator: "Regsure",
  alternates: { canonical: "/" },
  icons: { icon: "/icon.svg", apple: "/icon.svg" },
  openGraph: {
    type: "website",
    url: "https://regsure.vercel.app/",
    siteName: "Regsure",
    title: "Regsure | Know your business by heart",
    description,
    images: [
      {
        url: "/og-regsure.svg",
        width: 1200,
        height: 630,
        alt: "Regsure business bookkeeping and inventory workspace",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Regsure | Know your business by heart",
    description,
    images: ["/og-regsure.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ToastBridge />
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Regsure",
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description,
              url: "https://regsure.vercel.app/",
              image: "https://regsure.vercel.app/og-regsure.svg",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "NGN",
                description:
                  "Inventory, sales, and business operations for growing local businesses.",
              },
            }),
          }}
        />
      </body>
    </html>
  );
}
