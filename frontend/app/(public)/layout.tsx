// import "../globals.css";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[var(--bg)] text-[var(--text)]">
      {children}
    </div>
  );
}
