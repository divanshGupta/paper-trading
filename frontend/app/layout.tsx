// frontend/app/layout.tsx
// eslint-disable-next-line @typescript-eslint/no-require-imports
import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ClientProviders from "@/components/providers/ClientProviders"

export const metadata: Metadata = {
  title: "SimTrading - Learn Stock Trading Without Losing Money",
  description: "Practice delivery and intraday trading with ₹1,00,000 virtual money. Learn stock trading safely with real-market simulation.",
  keywords: [
    'trading simulator',
    'stock market learning',
    'paper trading india',
    'intraday trading practice',
    'learn trading without risk',
    "Trade", "Paper Trading", "Trading Simulator", "Trading Learning", "Stock Trading", "Stock Game", "Stock Market Learning"
  ],
  metadataBase: new URL('https://simtrading.vercel.app'),
  authors: [{name: "Divyansh Gupta"}],

  openGraph: {
    title: 'SimTrading – Learn Trading Without Losing ₹1',
    description:
      'A beginner-friendly stock trading simulator to practice delivery and intraday trading using virtual money.',
    url: 'https://simtrading.vercel.app',
    siteName: 'SimTrading',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SimTrading trading simulator dashboard',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'SimTrading – Learn Trading Safely',
    description:
      'Practice stock trading with ₹1,00,000 virtual money. No real losses.',
    images: ['/og-image.png'],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
    },
  },
};

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
})

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-bg-main text-text antialiased`}>
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}