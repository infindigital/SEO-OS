import type { Profile as ProfileRecord } from "@prisma/client";
import { Profile } from "@backend/domain/auth/profile";
import type { UserRole } from "@backend/domain/auth/user-role";

export function toDomain(record: ProfileRecord): Profile {
  return Profile.reconstitute({
    id: record.id,
    email: record.email,
    role: record.role as UserRole,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}
