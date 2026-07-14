import { Badge } from "@/components/ui/badge";
import type { ClientStatus } from "@backend/domain/client/client-status";

import { CLIENT_STATUS_META } from "../status";

export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const meta = CLIENT_STATUS_META[status];
  return <Badge className={meta.badgeClassName}>{meta.label}</Badge>;
}
