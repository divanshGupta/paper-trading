import Footer from "@/components/navbar/Footer";
import Navbar from "@/components/navbar/Navbar";

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
            <Navbar />
              <main className="pt-20 md:pt-24">
                {children}
              </main>
            <Footer />
    </>
  );
}
