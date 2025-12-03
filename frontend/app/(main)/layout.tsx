import ToastProvider from "../../components/providers/ToastProvider";
import SocketProvider from "@/components/providers/SocketProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { BalanceProvider } from "../../components/providers/BalanceProvider";
import Footer from "@/components/navbar/Footer";
import Navbar from "@/components/navbar/Navbar";
import { AppProvider } from "@/components/providers/AppProvider";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
        <SocketProvider>
          <ThemeProvider 
            attribute="class" 
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
          >
            <AppProvider>
              <BalanceProvider>
                <ToastProvider />
                <Navbar />
                  <main className="pt-[72px]">
                    {children}
                  </main>
                <Footer />
              </BalanceProvider>
            </AppProvider>
          </ThemeProvider>
        </SocketProvider>
    </>
  );
}
