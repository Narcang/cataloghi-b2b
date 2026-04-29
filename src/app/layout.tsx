import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Bodoni_Moda } from "next/font/google";
import PwaInstallBanner from "@/components/PwaInstallBanner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/** Sostituto temporaneo per Misu (titoli catalogo home): serif alta moda */
const ladivaCatalogCaption = Bodoni_Moda({
  variable: "--font-ladiva-catalog-caption",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ladiva Ceramica | Ceramica Italiana dal 2013",
  description:
    "Ladiva Ceramica produce piastrelle artigianali italiane con decorazioni a rilievo, nate dalla tradizione di Carpineti (RE). Scopri le nostre collezioni.",
  applicationName: "Ladiva",
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${ladivaCatalogCaption.variable} antialiased`}
      >
        {children}
        <PwaInstallBanner />
      </body>
    </html>
  );
}
