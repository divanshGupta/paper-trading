import ToastProvider from "../../components/providers/ToastProvider";
import SocketProvider from "@/components/providers/SocketProvider";
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
        <AppProvider>
          <BalanceProvider>
            <ToastProvider />
            <Navbar />
              <main className="pt-20 md:pt-24">
                {children}
              </main>
            <Footer />
          </BalanceProvider>
        </AppProvider>
    </SocketProvider>
    </>
  );
}
