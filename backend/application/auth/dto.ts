import type { UserRole } from "@backend/domain/auth/user-role";

export interface ProfileView {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterUserInput {
  email: string;
  password: string;
}

export interface RegisterUserResult {
  profile: ProfileView;
  /** Whether a session was established (false when email confirmation is required). */
  hasSession: boolean;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface UpdateUserRoleInput {
  userId: string;
  role: UserRole;
}
