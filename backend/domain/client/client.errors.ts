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
