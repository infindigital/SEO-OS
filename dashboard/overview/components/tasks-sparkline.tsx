"use client";

import { Area, AreaChart, ResponsiveContainer } from "recharts";

import type { TasksPoint } from "@backend/application/metrics/dto";

export function TasksSparkline({ data }: { data: TasksPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={48}>
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="tasks-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-4)" stopOpacity={0.3} />
            <stop offset="100%" stopColor="var(--chart-4)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area
          type="monotone"
          dataKey="open"
          stroke="var(--chart-4)"
          strokeWidth={1.5}
          fill="url(#tasks-fill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
