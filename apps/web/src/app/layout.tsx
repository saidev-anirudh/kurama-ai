import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kurama Voice Portfolio",
  description: "Futuristic voice-first portfolio scaffold",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="top-nav">
          <Link href="/">Kurama</Link>
          <nav>
            <Link href="/about">About</Link>
            <Link href="/projects">Projects</Link>
            <Link href="/career-timeline">Career Timeline</Link>
            <Link href="/passions">Passions</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/labs">Labs</Link>
            <Link href="/now">Now</Link>
            <Link href="/contact">Contact</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
