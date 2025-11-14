export function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[var(--brand)] bg-[var(--brand-light)]/20 px-2 py-1 rounded-lg text-sm font-medium">
      {children}
    </span>
  );
}
