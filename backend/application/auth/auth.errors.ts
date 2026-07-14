import { ApplicationError } from "@backend/application/shared/application-error";

/** Raised when credentials are rejected by the auth provider. */
export class AuthenticationError extends ApplicationError {}

export class EmailAlreadyInUseError extends ApplicationError {
  constructor(email: string) {
    super(`An account with ${email} already exists.`);
  }
}

export class ProfileNotFoundError extends ApplicationError {
  constructor(id: string) {
    super(`Profile "${id}" was not found.`);
  }
}

/** Raised when an action requires a signed-in user but none is present. */
export class UnauthorizedError extends ApplicationError {
  constructor() {
    super("You must be signed in to continue.");
  }
}

/** Raised when a signed-in user lacks the required role. */
export class ForbiddenError extends ApplicationError {
  constructor() {
    super("You do not have permission to perform this action.");
  }
}
