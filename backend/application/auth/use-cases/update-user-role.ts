import type { ProfileRepository } from "../ports/profile-repository";
import type { ProfileView, UpdateUserRoleInput } from "../dto";
import { ProfileNotFoundError } from "../auth.errors";
import { toProfileView } from "../mapper";

export class UpdateUserRole {
  constructor(private readonly profiles: ProfileRepository) {}

  async execute(input: UpdateUserRoleInput): Promise<ProfileView> {
    const profile = await this.profiles.findById(input.userId);
    if (!profile) {
      throw new ProfileNotFoundError(input.userId);
    }

    profile.changeRole(input.role);
    await this.profiles.update(profile);

    return toProfileView(profile);
  }
}
