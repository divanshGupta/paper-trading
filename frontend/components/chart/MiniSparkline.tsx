"use client";

import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from "recharts";

interface MiniSparklineProps {
  data: { time: number; value: number }[];
  color?: string;
  height?: number;
}

export default function MiniSparkline({
  data,
  color = "#22c55e",
  height = 40,
}: MiniSparklineProps) {
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <AreaChart data={data}>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={color}
            fillOpacity={0.15}
            strokeWidth={2}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
