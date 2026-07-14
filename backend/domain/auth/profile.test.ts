import { describe, expect, it } from "vitest";

import { Profile } from "./profile";
import {
  InvalidProfileEmailError,
  InvalidUserRoleError,
} from "./profile.errors";
import type { UserRole } from "./user-role";

describe("Profile entity", () => {
  it("creates a profile with a normalized email", () => {
    const profile = Profile.create({
      id: "user-1",
      email: "  Admin@Example.COM ",
      role: "ADMIN",
    });

    expect(profile.email).toBe("admin@example.com");
    expect(profile.role).toBe("ADMIN");
  });

  it("rejects an invalid email", () => {
    expect(() =>
      Profile.create({ id: "user-1", email: "not-an-email", role: "CLIENT" }),
    ).toThrow(InvalidProfileEmailError);
  });

  it("rejects an invalid role", () => {
    expect(() =>
      Profile.create({
        id: "user-1",
        email: "user@example.com",
        role: "SUPERUSER" as UserRole,
      }),
    ).toThrow(InvalidUserRoleError);
  });

  it("changes role and bumps updatedAt", () => {
    const profile = Profile.create({
      id: "user-1",
      email: "user@example.com",
      role: "CLIENT",
      createdAt: new Date("2020-01-01T00:00:00.000Z"),
    });
    const before = profile.updatedAt.getTime();

    profile.changeRole("DEVELOPER");

    expect(profile.role).toBe("DEVELOPER");
    expect(profile.updatedAt.getTime()).toBeGreaterThan(before);
  });
});
