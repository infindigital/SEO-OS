"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { ClientGrowthPoint } from "@backend/application/dashboards/dto";

import { formatMonth } from "../lib";
import { AXIS_TICK, TOOLTIP_LABEL_STYLE, TOOLTIP_STYLE } from "./chart-theme";

/** Cumulative client count by month (single series). */
export function ClientGrowthChart({ data }: { data: ClientGrowthPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid
          vertical={false}
          stroke="var(--border)"
          strokeDasharray="3 3"
        />
        <XAxis
          dataKey="month"
          tickFormatter={formatMonth}
          tickLine={false}
          axisLine={false}
          minTickGap={16}
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
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          contentStyle={TOOLTIP_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          labelFormatter={(label) => formatMonth(String(label))}
          formatter={(value, _name, item) => {
            const added = (item?.payload as ClientGrowthPoint | undefined)?.added;
            const suffix = added ? ` (+${added} new)` : "";
            return [`${value}${suffix}`, "Total clients"];
          }}
        />
        <Bar
          dataKey="total"
          fill="var(--chart-1)"
          radius={[4, 4, 0, 0]}
          maxBarSize={48}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
