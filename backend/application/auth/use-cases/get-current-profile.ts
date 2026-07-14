import { Profile } from "@backend/domain/auth/profile";
import { resolveInitialRole } from "@backend/domain/auth/initial-role-policy";
import type { AuthGateway } from "../ports/auth-gateway";
import type { ProfileRepository } from "../ports/profile-repository";
import type { ProfileView } from "../dto";
import { toProfileView } from "../mapper";

/**
 * Resolve the profile of the currently authenticated user. If the auth account
 * exists without a profile (e.g. created out of band), a profile is provisioned
 * lazily so the identity model stays consistent.
 */
export class GetCurrentProfile {
  constructor(
    private readonly auth: AuthGateway,
    private readonly profiles: ProfileRepository,
    private readonly adminEmails: readonly string[],
  ) {}

  async execute(): Promise<ProfileView | null> {
    const user = await this.auth.getCurrentUser();
    if (!user) {
      return null;
    }

    const existing = await this.profiles.findById(user.id);
    if (existing) {
      return toProfileView(existing);
    }

    const profile = Profile.create({
      id: user.id,
      email: user.email,
      role: resolveInitialRole(user.email, this.adminEmails),
    });

    try {
      await this.profiles.create(profile);
      return toProfileView(profile);
    } catch (error) {
      // A concurrent request may have created it first; fall back to a read.
      const created = await this.profiles.findById(user.id);
      if (created) {
        return toProfileView(created);
      }
      throw error;
    }
  }
}
