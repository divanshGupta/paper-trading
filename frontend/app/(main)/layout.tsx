import Footer from "@/components/navbar/Footer";
import Navbar from "@/components/navbar/Navbar";
import MarketPopupWrapper from "@/components/ui/MarketPopupWrapper";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <Navbar />
      <MarketPopupWrapper />
        <main className="pt-20 md:pt-24">
          {children}
        </main>
      <Footer />
    </>
  );
}
