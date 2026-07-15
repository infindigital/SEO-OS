import { Badge } from "@/components/ui/badge";
import type { DevTaskStatus } from "@backend/domain/developer-task/developer-task-status";

import { STATUS_META } from "../status";

export function StatusBadge({ status }: { status: DevTaskStatus }) {
  const meta = STATUS_META[status];
  return <Badge className={meta.badgeClassName}>{meta.label}</Badge>;
}
