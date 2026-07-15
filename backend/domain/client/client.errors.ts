import { DomainError } from "../shared/domain-error";
import { CLIENT_NAME_MAX_LENGTH } from "./client-rules";

export class InvalidClientNameError extends DomainError {
  constructor() {
    super(
      `Client name is required and must be at most ${CLIENT_NAME_MAX_LENGTH} characters.`,
    );
  }
}

export class InvalidClientWebsiteError extends DomainError {
  constructor(value: string) {
    super(`"${value}" is not a valid website address.`);
  }
}

export class InvalidClientEmailError extends DomainError {
  constructor(value: string) {
    super(`"${value}" is not a valid email address.`);
  }
}

export class InvalidClientStatusError extends DomainError {
  constructor(value: string) {
    super(`"${value}" is not a valid client status.`);
  }
}

export class InvalidClientRetainerError extends DomainError {
  constructor(value: number) {
    super(`Monthly retainer must be a whole, non-negative amount (got ${value}).`);
  }
}

export class InvalidClientSeoScoreError extends DomainError {
  constructor(value: number) {
    super(`SEO score must be a whole number between 0 and 100 (got ${value}).`);
  }
}
