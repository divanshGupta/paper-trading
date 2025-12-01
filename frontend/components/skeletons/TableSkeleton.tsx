"use client";

export default function TableSkeleton({
  rows = 6,
  cols = 5,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="w-full overflow-hidden rounded-xl border border-border bg-bg-surface animate-pulse">
      <table className="w-full">
        <thead>
          <tr className="bg-bg-elevated">
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i} className="p-3">
                <div className="h-5 w-20 bg-bg-elevated/40 rounded"></div>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r} className="border-t border-border">
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c} className="p-3">
                  <div className="h-8 w-full bg-bg-elevated/30 rounded"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
