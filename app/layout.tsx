import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Inter, Nunito_Sans } from "next/font/google";
import "./tokens.css";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });
// v2 fonts, exposed as variables only, so screens not yet restyled keep Inter.
const display = Bricolage_Grotesque({ subsets: ["latin"], weight: "800", variable: "--font-display" });
const body = Nunito_Sans({ subsets: ["latin"], weight: ["600", "700", "800", "900"], variable: "--font-body" });

export const metadata: Metadata = { title: "JobBuddy" };
export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
