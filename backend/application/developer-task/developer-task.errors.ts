import { ApplicationError } from "@backend/application/shared/application-error";

export class DeveloperTaskNotFoundError extends ApplicationError {
  constructor(id: string) {
    super(`Developer task "${id}" was not found.`);
  }
}

export class UnsupportedScreenshotTypeError extends ApplicationError {
  constructor(contentType: string) {
    super(`"${contentType}" is not a supported image type.`);
  }
}
