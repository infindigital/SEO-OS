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

import type { SeoHealthPoint } from "@backend/application/dashboards/dto";

import { formatShortDate } from "../lib";
import { AXIS_TICK, TOOLTIP_LABEL_STYLE, TOOLTIP_STYLE } from "./chart-theme";

/** Average portfolio SEO score over time (single series, 0–100). */
export function SeoHealthChart({ data }: { data: SeoHealthPoint[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ left: 4, right: 8, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="seo-health-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-2)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--chart-2)" stopOpacity={0} />
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
          width={32}
          domain={[0, 100]}
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
        />
        <Tooltip
          cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
          contentStyle={TOOLTIP_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          labelFormatter={(label) => formatShortDate(String(label))}
          formatter={(value) => [String(value), "SEO score"]}
        />
        <Area
          type="monotone"
          dataKey="score"
          stroke="var(--chart-2)"
          strokeWidth={2}
          fill="url(#seo-health-fill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
