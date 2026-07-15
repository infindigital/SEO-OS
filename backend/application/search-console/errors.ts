import { ApplicationError } from "@backend/application/shared/application-error";

export class SearchConsoleConnectionNotFoundError extends ApplicationError {
  constructor(id: string) {
    super(`Search Console connection "${id}" was not found.`);
  }
}

export class SearchConsoleNotConnectedError extends ApplicationError {
  constructor(id: string) {
    super(`Search Console connection "${id}" has no stored credentials.`);
  }
}
