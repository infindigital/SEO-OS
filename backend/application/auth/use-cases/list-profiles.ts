import type { ProfileRepository } from "../ports/profile-repository";
import type { ProfileView } from "../dto";
import { toProfileView } from "../mapper";

export class ListProfiles {
  constructor(private readonly profiles: ProfileRepository) {}

  async execute(): Promise<ProfileView[]> {
    const profiles = await this.profiles.list();
    return profiles.map(toProfileView);
  }
}
