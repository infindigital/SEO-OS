import { Badge } from "@/components/ui/badge";
import type { UserRole } from "@backend/domain/auth/user-role";

import { USER_ROLE_META } from "../roles";

export function RoleBadge({ role }: { role: UserRole }) {
  const meta = USER_ROLE_META[role];
  return <Badge className={meta.badgeClassName}>{meta.label}</Badge>;
}
