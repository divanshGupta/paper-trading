import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function DashboardShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Sidebar />

      <main className="pt-20 bg-[var(--bg)] min-h-screen">
        {children}
      </main>
    </>
  );
}
