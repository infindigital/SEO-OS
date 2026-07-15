"use client";

import { useState } from "react";
import { FileText, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PortalReport } from "@backend/application/client-portal/dto";

import { formatDate } from "../lib";
import { PublishReportDialog } from "./publish-report-dialog";

export function ReportsCard({
  reports,
  clientId,
  canPublish,
}: {
  reports: PortalReport[];
  clientId: string;
  canPublish: boolean;
}) {
  const [publishOpen, setPublishOpen] = useState(false);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle className="text-base">Reports</CardTitle>
          <CardDescription>Your delivered reports</CardDescription>
        </div>
        {canPublish && (
          <Button size="sm" variant="outline" onClick={() => setPublishOpen(true)}>
            <Plus />
            Publish
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {reports.length === 0 ? (
          <p className="text-muted-foreground text-sm">No reports yet.</p>
        ) : (
          <ul className="space-y-3">
            {reports.map((report) => (
              <li key={report.id} className="flex items-start gap-3">
                <FileText className="text-muted-foreground mt-0.5 size-4 shrink-0" />
                <div className="min-w-0">
                  <div className="text-sm font-medium">
                    {report.url ? (
                      <a
                        href={report.url}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline"
                      >
                        {report.title}
                      </a>
                    ) : (
                      report.title
                    )}
                  </div>
                  {report.summary && (
                    <p className="text-muted-foreground text-xs">{report.summary}</p>
                  )}
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {report.period ? `${report.period} · ` : ""}
                    {formatDate(report.publishedAt)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {canPublish && (
        <PublishReportDialog
          open={publishOpen}
          onOpenChange={setPublishOpen}
          clientId={clientId}
        />
      )}
    </Card>
  );
}
