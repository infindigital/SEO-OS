import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { GetCurrentProfile } from "@backend/application/auth/use-cases/get-current-profile";
import type { ProfileView } from "@backend/application/auth/dto";
import { SupabaseAuthGateway } from "@backend/infrastructure/auth/supabase-auth-gateway";
import { PrismaProfileRepository } from "@backend/infrastructure/auth/prisma-profile-repository";
import type { UserRole } from "@backend/domain/auth/user-role";

function adminEmails(): string[] {
  return (process.env.SEED_ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

/**
 * The authenticated user's profile for the current request, or `null` if not
 * signed in. Memoized per request so repeated calls (layout + page) don't
 * re-hit the auth provider.
 */
export const getCurrentProfile = cache(
  async (): Promise<ProfileView | null> => {
    const supabase = await createSupabaseServerClient();
    const useCase = new GetCurrentProfile(
      new SupabaseAuthGateway(supabase),
      new PrismaProfileRepository(prisma),
      adminEmails(),
    );
    return useCase.execute();
  },
);

/** Require an authenticated user; redirect to login otherwise. */
export async function requireUser(): Promise<ProfileView> {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect("/login");
  }
  return profile;
}

/** Require an authenticated user holding one of `roles`; redirect otherwise. */
export async function requireRole(roles: UserRole[]): Promise<ProfileView> {
  const profile = await requireUser();
  if (!roles.includes(profile.role)) {
    redirect("/forbidden");
  }
  return profile;
}

export type Authorization =
  | { ok: true; profile: ProfileView }
  | { ok: false; error: string };

/**
 * Authorize a server action without redirecting. Returns a discriminated result
 * so the action can surface a message to the caller.
 */
export async function authorizeAction(
  roles: UserRole[],
): Promise<Authorization> {
  const profile = await getCurrentProfile();
  if (!profile) {
    return { ok: false, error: "You must be signed in to continue." };
  }
  if (!roles.includes(profile.role)) {
    return {
      ok: false,
      error: "You do not have permission to perform this action.",
    };
  }
  return { ok: true, profile };
}
