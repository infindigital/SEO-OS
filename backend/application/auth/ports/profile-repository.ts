import type { Profile } from "@backend/domain/auth/profile";

export interface ProfileRepository {
  create(profile: Profile): Promise<void>;
  update(profile: Profile): Promise<void>;
  findById(id: string): Promise<Profile | null>;
  findByEmail(email: string): Promise<Profile | null>;
  list(): Promise<Profile[]>;
}
