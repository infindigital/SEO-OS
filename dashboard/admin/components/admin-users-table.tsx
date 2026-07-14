"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ProfileView } from "@backend/application/auth/dto";
import { isUserRole, type UserRole } from "@backend/domain/auth/user-role";

import { updateUserRoleAction } from "@/app/(dashboard)/admin/actions";
import { RoleBadge } from "@dashboard/components/role-badge";
import { USER_ROLE_OPTIONS } from "@dashboard/roles";

export function AdminUsersTable({
  users,
  currentUserId,
}: {
  users: ProfileView[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function onRoleChange(userId: string, next: string) {
    if (!isUserRole(next)) {
      return;
    }
    setPendingId(userId);
    const result = await updateUserRoleAction({ userId, role: next });
    setPendingId(null);

    if (result.ok) {
      toast.success("Role updated.");
      router.refresh();
    } else {
      toast.error(result.error);
    }
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead className="w-48">Change role</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const isSelf = user.id === currentUserId;
            return (
              <TableRow key={user.id}>
                <TableCell>
                  <span className="font-medium">{user.email}</span>
                  {isSelf && (
                    <span className="text-muted-foreground ml-2 text-xs">
                      (you)
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <RoleBadge role={user.role} />
                </TableCell>
                <TableCell>
                  <Select
                    value={user.role}
                    disabled={isSelf || pendingId === user.id}
                    onValueChange={(next: UserRole | string) =>
                      onRoleChange(user.id, next)
                    }
                  >
                    <SelectTrigger
                      className="w-40"
                      aria-label={`Change role for ${user.email}`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_ROLE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
