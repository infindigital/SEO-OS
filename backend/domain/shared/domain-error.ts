/**
 * Base class for all domain-level errors. Domain errors represent violations
 * of business rules and are safe to surface to callers.
 */
export abstract class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
