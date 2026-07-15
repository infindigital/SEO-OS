import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import type { DeveloperBoardSummary } from "@backend/application/developer-task/dto";
import { DeveloperBoardCards } from "./components/developer-board-cards";
import { PriorityBadge } from "./components/priority-badge";
import { StatusBadge } from "./components/status-badge";
import { CompletionBar } from "./components/completion-bar";

describe("Developer board presentation", () => {
  it("renders every KPI card with its value", () => {
    const summary: DeveloperBoardSummary = {
      totalTasks: 10,
      openTasks: 6,
      completedTasks: 4,
      overdueTasks: 2,
      averageCompletion: 57,
    };
    const html = renderToStaticMarkup(<DeveloperBoardCards summary={summary} />);

    expect(html).toContain("Open Tasks");
    expect(html).toContain("Completed");
    expect(html).toContain("Overdue");
    expect(html).toContain("Avg. Completion");
    expect(html).toContain("57%");
    expect(html).toContain("of 10 total");
  });

  it("renders priority and status badges with labels", () => {
    expect(renderToStaticMarkup(<PriorityBadge priority="CRITICAL" />)).toContain(
      "Critical",
    );
    expect(renderToStaticMarkup(<StatusBadge status="IN_PROGRESS" />)).toContain(
      "In progress",
    );
  });

  it("renders a completion meter with an accessible value", () => {
    const html = renderToStaticMarkup(<CompletionBar value={75} />);
    expect(html).toContain('aria-valuenow="75"');
    expect(html).toContain("75%");
  });
});
