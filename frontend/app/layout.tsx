import type { Metadata } from "next";
import { ThemeProvider } from "next-themes";
import "./globals.css";

export const metadata: Metadata = {
  title: "SimTrading - Trading Simulator",
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
    <html lang="en" suppressHydrationWarning>
      <body className="bg-bg-main text-text antialiased">
        <ThemeProvider 
          attribute="class" 
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}