import type { Profile } from "@backend/domain/auth/profile";
import type { ProfileView } from "./dto";

export function toProfileView(profile: Profile): ProfileView {
  return {
    id: profile.id,
    email: profile.email,
    role: profile.role,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}
