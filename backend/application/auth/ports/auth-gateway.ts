export interface AuthUser {
  id: string;
  email: string;
}

export interface SignUpResult {
  userId: string;
  hasSession: boolean;
}

/**
 * Port abstracting the authentication provider (Supabase Auth). Use cases
 * depend on this interface so they remain decoupled from the concrete provider
 * and testable with a fake.
 */
export interface AuthGateway {
  signUp(email: string, password: string): Promise<SignUpResult>;
  signInWithPassword(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<AuthUser | null>;
}
