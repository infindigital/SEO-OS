import { ApplicationError } from "@backend/application/shared/application-error";

export class ClientNotFoundError extends ApplicationError {
  constructor(id: string) {
    super(`Client "${id}" was not found.`);
  }
}
