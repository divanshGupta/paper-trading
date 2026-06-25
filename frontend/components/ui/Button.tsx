export function Button({
  children,
  variant = "primary",
}: {
  children: React.ReactNode;
  variant?: "primary" | "ghost";
}) {
  const styles = {
    primary: "bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-dark)]",
    ghost: "bg-transparent hover:bg-[var(--color-bg-surface)] border border-[var(--color-border)]",
  };

  return (
    <button
      className={`px-4 py-2 rounded-lg font-medium transition ${styles[variant]}`}
    >
      {children}
    </button>
  );
}
