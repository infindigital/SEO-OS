import { Badge } from "@/components/ui/badge";
import type { DevTaskPriority } from "@backend/domain/developer-task/developer-task-priority";

import { PRIORITY_META } from "../priority";

export function PriorityBadge({ priority }: { priority: DevTaskPriority }) {
  const meta = PRIORITY_META[priority];
  return <Badge className={meta.badgeClassName}>{meta.label}</Badge>;
}
