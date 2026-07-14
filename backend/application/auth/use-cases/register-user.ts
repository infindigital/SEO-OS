import { Profile } from "@backend/domain/auth/profile";
import { resolveInitialRole } from "@backend/domain/auth/initial-role-policy";
import type { AuthGateway } from "../ports/auth-gateway";
import type { ProfileRepository } from "../ports/profile-repository";
import type { RegisterUserInput, RegisterUserResult } from "../dto";
import { toProfileView } from "../mapper";

/**
 * Register a new user: create the auth account, then provision an application
 * profile with a role derived from the initial-role policy.
 */
export class RegisterUser {
  constructor(
    private readonly auth: AuthGateway,
    private readonly profiles: ProfileRepository,
    private readonly adminEmails: readonly string[],
  ) {}

  async execute(input: RegisterUserInput): Promise<RegisterUserResult> {
    const { userId, hasSession } = await this.auth.signUp(
      input.email,
      input.password,
    );

    const profile = Profile.create({
      id: userId,
      email: input.email,
      role: resolveInitialRole(input.email, this.adminEmails),
    });

    await this.profiles.create(profile);

    return { profile: toProfileView(profile), hasSession };
  }
}
