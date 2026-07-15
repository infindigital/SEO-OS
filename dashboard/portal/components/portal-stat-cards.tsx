import { CheckCircle2, Gauge, TrendingUp, Search } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClientPortal } from "@backend/application/client-portal/dto";

import { formatNumber } from "../lib";

interface CardSpec {
  label: string;
  value: string;
  hint: string;
  icon: typeof Gauge;
}

export function PortalStatCards({ portal }: { portal: ClientPortal }) {
  const cards: CardSpec[] = [
    {
      label: "SEO Score",
      value: portal.seoScore != null ? String(portal.seoScore) : "—",
      hint: "Out of 100",
      icon: Gauge,
    },
    {
      label: "Organic Traffic",
      value: portal.organicTraffic.connected
        ? formatNumber(portal.organicTraffic.clicks)
        : "—",
      hint: portal.organicTraffic.connected ? "Clicks from search" : "Not connected yet",
      icon: TrendingUp,
    },
    {
      label: "Keywords",
      value: formatNumber(portal.keywords.total),
      hint: "Ranking in search",
      icon: Search,
    },
    {
      label: "Completed Work",
      value: formatNumber(portal.completedWork.total),
      hint: "Delivered items",
      icon: CheckCircle2,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-muted-foreground text-sm font-medium">
                {card.label}
              </CardTitle>
              <Icon className="text-muted-foreground size-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tabular-nums">{card.value}</div>
              <p className="text-muted-foreground mt-1 text-xs">{card.hint}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
