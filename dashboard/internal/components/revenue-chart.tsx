"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { RevenuePoint } from "@backend/application/dashboards/dto";

import { formatCompactCurrency, formatCurrency, formatShortDate } from "../lib";
import { AXIS_TICK, TOOLTIP_LABEL_STYLE, TOOLTIP_STYLE } from "./chart-theme";

/** Monthly recurring revenue over time (single series). */
export function RevenueChart({ data }: { data: RevenuePoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-4)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--chart-4)" stopOpacity={0} />
          </linearGradient>
        </defs>
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
          width={48}
          tickFormatter={formatCompactCurrency}
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
        />
        <Tooltip
          cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
          contentStyle={TOOLTIP_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          labelFormatter={(label) => formatShortDate(String(label))}
          formatter={(value) => [formatCurrency(Number(value)), "Revenue"]}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke="var(--chart-4)"
          strokeWidth={2}
          fill="url(#revenue-fill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
