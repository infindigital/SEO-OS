"use server";

import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { RegisterUser } from "@backend/application/auth/use-cases/register-user";
import { SignIn } from "@backend/application/auth/use-cases/sign-in";
import { SignOut } from "@backend/application/auth/use-cases/sign-out";
import { SupabaseAuthGateway } from "@backend/infrastructure/auth/supabase-auth-gateway";
import { PrismaProfileRepository } from "@backend/infrastructure/auth/prisma-profile-repository";
import { signInSchema, signUpSchema } from "@backend/interface/auth/auth.schemas";
import { DomainError } from "@backend/domain/shared/domain-error";
import { ApplicationError } from "@backend/application/shared/application-error";
import {
  type ActionResult,
  failure,
  fromZodError,
  ok,
} from "@backend/interface/shared/action-result";

const GENERIC_ERROR = "Something went wrong. Please try again.";

function adminEmails(): string[] {
  return (process.env.SEED_ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function toFailure(error: unknown): ActionResult<never> {
  if (error instanceof DomainError || error instanceof ApplicationError) {
    return failure(error.message);
  }
  console.error("[auth action] unexpected error", error);
  return failure(GENERIC_ERROR);
}

export async function signInAction(input: unknown): Promise<ActionResult<null>> {
  const parsed = signInSchema.safeParse(input);
  if (!parsed.success) {
    return fromZodError(parsed.error);
  }

  const supabase = await createSupabaseServerClient();
  const signIn = new SignIn(new SupabaseAuthGateway(supabase));

  try {
    await signIn.execute(parsed.data);
    return ok(null);
  } catch (error) {
    return toFailure(error);
  }
}

export async function signUpAction(
  input: unknown,
): Promise<ActionResult<{ hasSession: boolean }>> {
  const parsed = signUpSchema.safeParse(input);
  if (!parsed.success) {
    return fromZodError(parsed.error);
  }

  const supabase = await createSupabaseServerClient();
  const register = new RegisterUser(
    new SupabaseAuthGateway(supabase),
    new PrismaProfileRepository(prisma),
    adminEmails(),
  );

  try {
    const { hasSession } = await register.execute(parsed.data);
    return ok({ hasSession });
  } catch (error) {
    return toFailure(error);
  }
}

export async function signOutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await new SignOut(new SupabaseAuthGateway(supabase)).execute();
  redirect("/login");
}
