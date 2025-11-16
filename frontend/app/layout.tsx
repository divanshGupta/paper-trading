import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tradesim - Trading Simulator",
  description: "Practice intraday & delivery trading with live market data",
  keywords: ["Trade", "Paper Trading", "Trading Simulator", "Trading Learning", "Stock Trading", "Stock Game", "Stock Market Learning"],
  authors: [{name: "Divyansh Gupta"}],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en"  suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased `}>
        {children}
      </body>
    </html>
  );
}