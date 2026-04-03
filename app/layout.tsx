import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SignaAI — AI Agent Infrastructure on Signum",
  description: "Payments, identity, verifiable outputs, and trustless escrow for AI agents. Built on Signum blockchain. No gas wars. Fixed fees.",
  openGraph: {
    title: "SignaAI",
    description: "AI agent infrastructure on Signum blockchain",
    url: "https://signaai.io",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
