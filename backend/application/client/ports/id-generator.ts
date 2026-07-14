/**
 * Port for generating unique identifiers. Keeps id creation out of the domain
 * and use cases so they remain pure and deterministically testable.
 */
export interface IdGenerator {
  generate(): string;
}
