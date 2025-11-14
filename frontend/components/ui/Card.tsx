export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[var(--bg-surface)] rounded-xl p-5 shadow-sm
    bg-light-surface dark:bg-dark-surface 
      er 
      transition cursor-pointer">
      {children}
    </div>
  );
}
