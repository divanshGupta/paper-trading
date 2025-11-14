export function Button({
  children,
  variant = "primary",
}: {
  children: React.ReactNode;
  variant?: "primary" | "ghost";
}) {
  const styles = {
    primary: "bg-[var(--brand)] text-white hover:bg-[var(--brand-dark)]",
    ghost: "bg-transparent hover:bg-[var(--bg-surface)] border border-[var(--border)]",
  };

  return (
    <button
      className={`px-4 py-2 rounded-lg font-medium transition ${styles[variant]}`}
    >
      {children}
    </button>
  );
}
