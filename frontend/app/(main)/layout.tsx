import ToastProvider from "../../components/providers/ToastProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { BalanceProvider } from "../../components/providers/BalanceProvider";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { AppProvider } from "@/components/providers/AppProvider";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="">
      <ToastProvider /> {/* global toast */ }
      <ThemeProvider attribute="class" defaultTheme="system">
        <BalanceProvider> 

          <AppProvider>
            <Navbar />
            <main className="pt-[72px]"> {/* keeps content below fixed navbar */}
              {children}
            </main>
            <Footer />
          </AppProvider>

        </BalanceProvider>
      </ThemeProvider>
    </div>
  );
};
