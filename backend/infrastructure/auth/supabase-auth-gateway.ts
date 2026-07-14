import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  AuthGateway,
  AuthUser,
  SignUpResult,
} from "@backend/application/auth/ports/auth-gateway";
import {
  AuthenticationError,
  EmailAlreadyInUseError,
} from "@backend/application/auth/auth.errors";

/**
 * Supabase-backed implementation of the {@link AuthGateway} port. Constructed
 * per request with a cookie-bound Supabase server client so that sessions are
 * read and written through Next.js.
 */
export class SupabaseAuthGateway implements AuthGateway {
  constructor(private readonly supabase: SupabaseClient) {}

  async signUp(email: string, password: string): Promise<SignUpResult> {
    const { data, error } = await this.supabase.auth.signUp({ email, password });

    if (error) {
      if (
        error.code === "user_already_exists" ||
        error.message.toLowerCase().includes("already registered")
      ) {
        throw new EmailAlreadyInUseError(email);
      }
      throw new AuthenticationError(error.message);
    }

    if (!data.user) {
      throw new AuthenticationError("Sign up failed. Please try again.");
    }

    return { userId: data.user.id, hasSession: data.session !== null };
  }

  async signInWithPassword(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.code === "invalid_credentials" || error.status === 400) {
        throw new AuthenticationError("Invalid email or password.");
      }
      if (error.code === "email_not_confirmed") {
        throw new AuthenticationError(
          "Please confirm your email address before signing in.",
        );
      }
      throw new AuthenticationError(error.message);
    }
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
  }

  async getCurrentUser(): Promise<AuthUser | null> {
    const { data, error } = await this.supabase.auth.getUser();
    if (error || !data.user) {
      return null;
    }
    return { id: data.user.id, email: data.user.email ?? "" };
  }
}
