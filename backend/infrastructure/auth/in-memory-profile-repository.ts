import type { Profile } from "@backend/domain/auth/profile";
import type { ProfileRepository } from "@backend/application/auth/ports/profile-repository";

/** In-memory {@link ProfileRepository} for unit tests. */
export class InMemoryProfileRepository implements ProfileRepository {
  private readonly store = new Map<string, Profile>();

  async create(profile: Profile): Promise<void> {
    if (this.store.has(profile.id)) {
      throw new Error(`Profile ${profile.id} already exists`);
    }
    for (const existing of this.store.values()) {
      if (existing.email === profile.email) {
        throw new Error(`Profile with email ${profile.email} already exists`);
      }
    }
    this.store.set(profile.id, profile);
  }

  async update(profile: Profile): Promise<void> {
    this.store.set(profile.id, profile);
  }

  async findById(id: string): Promise<Profile | null> {
    return this.store.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<Profile | null> {
    for (const profile of this.store.values()) {
      if (profile.email === email) {
        return profile;
      }
    }
    return null;
  }

  async list(): Promise<Profile[]> {
    return [...this.store.values()].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
  }
}
