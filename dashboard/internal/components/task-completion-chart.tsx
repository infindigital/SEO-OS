"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { TaskCompletionPoint } from "@backend/application/dashboards/dto";

import { formatShortDate } from "../lib";
import { AXIS_TICK, TOOLTIP_LABEL_STYLE, TOOLTIP_STYLE } from "./chart-theme";

const SERIES = [
  { key: "completed", label: "Completed", color: "var(--chart-2)" },
  { key: "open", label: "Open", color: "var(--chart-1)" },
] as const;

/** Completed vs. open tasks over time (two series, shared count scale). */
export function TaskCompletionChart({ data }: { data: TaskCompletionPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid
          vertical={false}
          stroke="var(--border)"
          strokeDasharray="3 3"
        />
        <XAxis
          dataKey="date"
          tickFormatter={formatShortDate}
          tickLine={false}
          axisLine={false}
          minTickGap={28}
          tick={AXIS_TICK}
        />
        <YAxis
          width={32}
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
        />
        <Tooltip
          cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
          contentStyle={TOOLTIP_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          labelFormatter={(label) => formatShortDate(String(label))}
        />
        <Legend
          verticalAlign="top"
          align="right"
          height={28}
          iconType="plainline"
          wrapperStyle={{ fontSize: "0.8rem" }}
        />
        {SERIES.map((series) => (
          <Line
            key={series.key}
            type="monotone"
            name={series.label}
            dataKey={series.key}
            stroke={series.color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
