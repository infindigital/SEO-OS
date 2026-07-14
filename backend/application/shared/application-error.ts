/**
 * Base class for application-level errors — failures that arise while
 * orchestrating a use case (e.g. a missing aggregate). Safe to surface to
 * callers as a message.
 */
export abstract class ApplicationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
