import type { Metadata, Viewport } from "next";
import { Inter, Inter_Tight } from "next/font/google";
import "./tokens.css";
import "./globals.css";

// Plum: Inter Tight for headlines, Inter for everything else.
const display = Inter_Tight({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-display" });
const body = Inter({ subsets: ["latin"], weight: ["400", "500", "700"], variable: "--font-body" });

export const metadata: Metadata = {
  title: "JobBuddy",
  applicationName: "JobBuddy",
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: { url: "/icons/apple-touch-icon.png", sizes: "180x180" },
  },
  // Full screen from the iPhone home screen. Translucent lets the plum headers sit under the
  // status bar (they already pad for the safe area); "black" would be a black bar, not plum.
  appleWebApp: { capable: true, title: "JobBuddy", statusBarStyle: "black-translucent" },
  // Next only writes mobile-web-app-capable; iOS before 16.4 needs the Apple name to open full screen.
  other: { "apple-mobile-web-app-capable": "yes" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover", themeColor: "#0b051d" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className={body.className}>{children}</body>
    </html>
  );
}
