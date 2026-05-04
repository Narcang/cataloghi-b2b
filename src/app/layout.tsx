import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import PwaInstallBanner from "@/components/PwaInstallBanner";
import { SITE_ICON_SEARCH } from "@/lib/siteIconVersion";
import "./globals.css";

const miso = localFont({
  src: [
    {
      path: "../../public/fonts/miso-light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/miso.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/miso-bold.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ladiva Ceramica | Ceramica Italiana dal 2013",
  description:
    "Ladiva Ceramica produce piastrelle artigianali italiane con decorazioni a rilievo, nate dalla tradizione di Carpineti (RE). Scopri le nostre collezioni.",
  applicationName: "Ladiva",
  icons: {
    icon: [{ url: `/icon.png?${SITE_ICON_SEARCH}`, type: "image/png", sizes: "512x512" }],
    shortcut: [`/icon.png?${SITE_ICON_SEARCH}`],
    apple: [{ url: `/apple-icon.png?${SITE_ICON_SEARCH}`, sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Ladiva",
    statusBarStyle: "default",
  },
  other: {
    "msapplication-TileColor": "#060d41",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#060d41",
  colorScheme: "light",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className={`${miso.variable} antialiased`}>
        {children}
        <PwaInstallBanner />
      </body>
    </html>
  );
}
