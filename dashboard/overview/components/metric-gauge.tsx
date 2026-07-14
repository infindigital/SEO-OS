"use client";

import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from "recharts";

/**
 * Circular gauge rendering a 0–100 value as a filled ring with the value
 * displayed in the centre.
 */
export function MetricGauge({
  value,
  color = "var(--chart-1)",
  unit = "%",
}: {
  value: number;
  color?: string;
  unit?: string;
}) {
  const data = [{ name: "value", value }];

  return (
    <div className="relative h-40">
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          data={data}
          innerRadius="72%"
          outerRadius="100%"
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis
            type="number"
            domain={[0, 100]}
            tick={false}
            axisLine={false}
          />
          <RadialBar
            dataKey="value"
            cornerRadius={8}
            fill={color}
            background={{ fill: "var(--muted)" }}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-semibold tabular-nums">
          {value}
          {unit && <span className="text-lg">{unit}</span>}
        </span>
      </div>
    </div>
  );
}
