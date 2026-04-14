import type { Metadata } from "next";
import { Inter, Orbitron, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import { AssistantShell } from "@/components/kurama/assistant-shell";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const orbitron = Orbitron({ subsets: ["latin"], variable: "--font-orbitron" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });

export const metadata: Metadata = {
  title: "Kurama Voice Portfolio",
  description: "Futuristic voice-first portfolio scaffold",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${orbitron.variable} ${spaceGrotesk.variable}`}>
        <header className="top-nav">
          <Link href="/">Kurama</Link>
          <nav>
            <Link href="/about">About</Link>
            <Link href="/projects">Projects</Link>
            <Link href="/career-timeline">Career Timeline</Link>
            <Link href="/blog">Blogs</Link>
            <Link href="/contact">Contact Me</Link>
          </nav>
        </header>
        <AssistantShell>{children}</AssistantShell>
      </body>
    </html>
  );
}
