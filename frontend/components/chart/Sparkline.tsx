"use client";

import { LineChart, Line, ResponsiveContainer } from "recharts";

interface SparklineProps {
  data: { time: number; value: number }[] | undefined;
  positive?: boolean; // green or red line
}

export default function Sparkline({ data = [], positive = true }: SparklineProps) {
  if (!data || data.length === 0) {
    return (
      <div className="h-40 w-full flex items-center justify-center text-text-secondary text-sm">
        Chart loading…
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line
            type="monotone"
            dataKey="value"
            dot={false}
            stroke={positive ? "var(--color-positive)" : "var(--color-negative)"}
            strokeWidth={1}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
