import { CheckCircle2, Search, Target } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ClientPortal } from "@backend/application/client-portal/dto";

import { PortalStatCards } from "./portal-stat-cards";
import { ReportsCard } from "./reports-card";
import { displayHost, formatDate, formatDateOrDash, formatNumber } from "../lib";

export function PortalView({
  portal,
  canPublish,
}: {
  portal: ClientPortal;
  canPublish: boolean;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{portal.client.name}</h1>
        {portal.client.website && (
          <a
            href={portal.client.website}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            {displayHost(portal.client.website)}
          </a>
        )}
      </div>

      <PortalStatCards portal={portal} />

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Current focus */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="text-muted-foreground size-4" />
              Current Focus
            </CardTitle>
            <CardDescription>What we&apos;re working on now</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm">
              {portal.client.currentFocus ?? (
                <span className="text-muted-foreground">
                  Your team will set the current focus soon.
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Keywords */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="text-muted-foreground size-4" />
              Keywords
            </CardTitle>
            <CardDescription>{formatNumber(portal.keywords.total)} ranking</CardDescription>
          </CardHeader>
          <CardContent>
            {portal.keywords.top.length === 0 ? (
              <p className="text-muted-foreground text-sm">No keyword data yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {portal.keywords.top.map((kw) => (
                  <li key={kw.keyword} className="flex items-center justify-between gap-3 text-sm">
                    <span className="truncate">{kw.keyword}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {formatNumber(kw.clicks)} clicks
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Completed work */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="text-muted-foreground size-4" />
              Completed Work
            </CardTitle>
            <CardDescription>{portal.completedWork.total} items delivered</CardDescription>
          </CardHeader>
          <CardContent>
            {portal.completedWork.recent.length === 0 ? (
              <p className="text-muted-foreground text-sm">No completed work yet.</p>
            ) : (
              <ul className="space-y-2">
                {portal.completedWork.recent.map((item, index) => (
                  <li key={`${item.title}-${index}`} className="text-sm">
                    <span>{item.title}</span>
                    <span className="text-muted-foreground ml-2 text-xs">
                      {formatDateOrDash(item.completedAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Timeline</CardTitle>
            <CardDescription>Recent milestones</CardDescription>
          </CardHeader>
          <CardContent>
            {portal.timeline.length === 0 ? (
              <p className="text-muted-foreground text-sm">Nothing here yet.</p>
            ) : (
              <ol className="space-y-3">
                {portal.timeline.map((item, index) => (
                  <li key={`${item.date}-${index}`} className="flex gap-3">
                    <div className="mt-1.5 flex flex-col items-center">
                      <span className="bg-primary size-2 shrink-0 rounded-full" />
                      {index < portal.timeline.length - 1 && (
                        <span className="bg-border mt-1 w-px flex-1" />
                      )}
                    </div>
                    <div className="pb-1">
                      <p className="text-sm">{item.label}</p>
                      <p className="text-muted-foreground text-xs">{formatDate(item.date)}</p>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </CardContent>
        </Card>
      </div>

      <ReportsCard
        reports={portal.reports}
        clientId={portal.client.id}
        canPublish={canPublish}
      />
    </div>
  );
}
