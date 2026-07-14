import { beforeEach, describe, expect, it } from "vitest";

import { InMemoryProfileRepository } from "@backend/infrastructure/auth/in-memory-profile-repository";
import type {
  AuthGateway,
  AuthUser,
  SignUpResult,
} from "./ports/auth-gateway";
import {
  AuthenticationError,
  EmailAlreadyInUseError,
  ProfileNotFoundError,
} from "./auth.errors";
import { RegisterUser } from "./use-cases/register-user";
import { GetCurrentProfile } from "./use-cases/get-current-profile";
import { SignIn } from "./use-cases/sign-in";
import { UpdateUserRole } from "./use-cases/update-user-role";
import { ListProfiles } from "./use-cases/list-profiles";

class FakeAuthGateway implements AuthGateway {
  private readonly users = new Map<string, { email: string; password: string }>();
  private currentUserId: string | null = null;
  private sequence = 0;

  async signUp(email: string, password: string): Promise<SignUpResult> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        throw new EmailAlreadyInUseError(email);
      }
    }
    this.sequence += 1;
    const id = `user-${this.sequence}`;
    this.users.set(id, { email, password });
    this.currentUserId = id;
    return { userId: id, hasSession: true };
  }

  async signInWithPassword(email: string, password: string): Promise<void> {
    const entry = [...this.users.entries()].find(
      ([, user]) => user.email === email && user.password === password,
    );
    if (!entry) {
      throw new AuthenticationError("Invalid email or password.");
    }
    this.currentUserId = entry[0];
  }

  async signOut(): Promise<void> {
    this.currentUserId = null;
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    if (!this.currentUserId) {
      return null;
    }
    const user = this.users.get(this.currentUserId);
    return user ? { id: this.currentUserId, email: user.email } : null;
  }
}

describe("Auth use cases", () => {
  let gateway: FakeAuthGateway;
  let profiles: InMemoryProfileRepository;

  beforeEach(() => {
    gateway = new FakeAuthGateway();
    profiles = new InMemoryProfileRepository();
  });

  it("registers clients by default and admins for configured emails", async () => {
    const register = new RegisterUser(gateway, profiles, ["boss@infin.dev"]);

    const client = await register.execute({
      email: "user@acme.com",
      password: "password123",
    });
    expect(client.profile.role).toBe("CLIENT");
    expect(client.hasSession).toBe(true);

    const admin = await register.execute({
      email: "BOSS@infin.dev",
      password: "password123",
    });
    expect(admin.profile.role).toBe("ADMIN");
  });

  it("rejects duplicate registrations", async () => {
    const register = new RegisterUser(gateway, profiles, []);
    await register.execute({ email: "user@acme.com", password: "password123" });

    await expect(
      register.execute({ email: "user@acme.com", password: "password123" }),
    ).rejects.toBeInstanceOf(EmailAlreadyInUseError);
  });

  it("resolves no profile when signed out, and the profile after signing in", async () => {
    const register = new RegisterUser(gateway, profiles, []);
    await register.execute({ email: "user@acme.com", password: "password123" });
    await gateway.signOut();

    const getCurrent = new GetCurrentProfile(gateway, profiles, []);
    expect(await getCurrent.execute()).toBeNull();

    await new SignIn(gateway).execute({
      email: "user@acme.com",
      password: "password123",
    });
    const profile = await getCurrent.execute();
    expect(profile?.email).toBe("user@acme.com");
  });

  it("lazily provisions a profile for an auth user that has none", async () => {
    const register = new RegisterUser(gateway, profiles, []);
    await register.execute({ email: "user@acme.com", password: "password123" });

    // Simulate an auth user whose profile does not yet exist.
    const emptyProfiles = new InMemoryProfileRepository();
    const getCurrent = new GetCurrentProfile(gateway, emptyProfiles, [
      "user@acme.com",
    ]);

    const resolved = await getCurrent.execute();
    expect(resolved?.email).toBe("user@acme.com");
    expect(resolved?.role).toBe("ADMIN");
  });

  it("updates a user's role", async () => {
    const register = new RegisterUser(gateway, profiles, []);
    const { profile } = await register.execute({
      email: "dev@infin.dev",
      password: "password123",
    });

    const updated = await new UpdateUserRole(profiles).execute({
      userId: profile.id,
      role: "DEVELOPER",
    });
    expect(updated.role).toBe("DEVELOPER");
  });

  it("throws when updating a missing profile", async () => {
    await expect(
      new UpdateUserRole(profiles).execute({ userId: "missing", role: "ADMIN" }),
    ).rejects.toBeInstanceOf(ProfileNotFoundError);
  });

  it("lists all profiles", async () => {
    const register = new RegisterUser(gateway, profiles, []);
    await register.execute({ email: "a@acme.com", password: "password123" });
    await register.execute({ email: "b@acme.com", password: "password123" });

    expect(await new ListProfiles(profiles).execute()).toHaveLength(2);
  });
});
