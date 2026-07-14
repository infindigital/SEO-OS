import { DomainError } from "../shared/domain-error";

export class InvalidProfileEmailError extends DomainError {
  constructor(value: string) {
    super(`"${value}" is not a valid email address.`);
  }
}

export class InvalidUserRoleError extends DomainError {
  constructor(value: string) {
    super(`"${value}" is not a valid user role.`);
  }
}
