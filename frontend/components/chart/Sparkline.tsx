"use client";

type SparklineProps = {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
};

export default function Sparkline({
  data,
  color = "#22c55e",
  width = 100,
  height = 32,
}: SparklineProps) {
  if (!data || data.length < 2) return null;

  // ---- Stabilize min/max using last 40–60 points -----------------
  const windowSize = 50;
  const slice = data.slice(-windowSize);
  const max = Math.max(...slice);
  const min = Math.min(...slice);

  // ---- Build smooth path with cubic curves -----------------------
  const step = width / (slice.length - 1);

  const points = slice.map((val, i) => {
    const x = i * step;
    const y = height - ((val - min) / (max - min || 1)) * height;
    return { x, y };
  });

  const pathD = points.reduce((acc, point, idx, arr) => {
    if (idx === 0) return `M ${point.x},${point.y}`;
    const prev = arr[idx - 1];
    const cx = (prev.x + point.x) / 2;
    return `${acc} C ${cx},${prev.y} ${cx},${point.y} ${point.x},${point.y}`;
  }, "");

  return (
    <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* soft background line */}
      <path
        d={pathD}
        stroke={color}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        style={{
        transition: "all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)",
        }}

      />
    </svg>
  );
}
