import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ToastProvider from "../components/providers/ToastProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { BalanceProvider } from "../components/providers/BalanceProvider";
import Footer from "@/components/shared/Footer";
import Navbar from "@/components/shared/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Tradesim",
  description: "Practice intraday & delivery trading with live market data",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`bg-[var(--bg)] text-[var(--text)]`}>
        <ToastProvider /> {/* global toast */ }
        <ThemeProvider attribute="class" defaultTheme="system">
          <BalanceProvider> 

            <Navbar />
            <main className="pt-[72px]"> {/* keeps content below fixed navbar */}
              {children}
            </main>
            <Footer />

          </BalanceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
};
