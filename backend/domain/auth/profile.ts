import { isUserRole, type UserRole } from "./user-role";
import { isValidEmail, normalizeEmail } from "../shared/email";
import {
  InvalidProfileEmailError,
  InvalidUserRoleError,
} from "./profile.errors";

export interface ProfileProps {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProfileProps {
  id: string;
  email: string;
  role: UserRole;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Application profile for an authenticated user. Owns the user's authorization
 * role and enforces its invariants.
 */
export class Profile {
  private constructor(private props: ProfileProps) {}

  static create(input: CreateProfileProps): Profile {
    const now = input.createdAt ?? new Date();
    return new Profile({
      id: input.id,
      email: normalizeValidEmail(input.email),
      role: assertRole(input.role),
      createdAt: now,
      updatedAt: input.updatedAt ?? now,
    });
  }

  static reconstitute(props: ProfileProps): Profile {
    return new Profile({ ...props });
  }

  changeRole(role: UserRole): void {
    this.props.role = assertRole(role);
    this.props.updatedAt = new Date();
  }

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  toObject(): ProfileProps {
    return { ...this.props };
  }
}

function normalizeValidEmail(email: string): string {
  const normalized = normalizeEmail(email);
  if (!isValidEmail(normalized)) {
    throw new InvalidProfileEmailError(email);
  }
  return normalized;
}

function assertRole(role: UserRole): UserRole {
  if (!isUserRole(role)) {
    throw new InvalidUserRoleError(String(role));
  }
  return role;
}
