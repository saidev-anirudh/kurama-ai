import type { Metadata } from "next";
import { Cormorant_Garamond, Orbitron, Space_Grotesk } from "next/font/google";
import { AuroraShell } from "@/components/aurora/AuroraShell";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["300", "400", "500", "700"],
});

const orbitron = Orbitron({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "500", "700", "900"],
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-organic",
  weight: ["400", "500"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Kurama Voice Portfolio",
  description: "Futuristic voice-first portfolio scaffold",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${orbitron.variable} ${cormorantGaramond.variable} font-body antialiased`}
      >
        <AuroraShell>{children}</AuroraShell>
      </body>
    </html>
  );
}
