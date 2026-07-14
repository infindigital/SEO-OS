import type { IdGenerator } from "@backend/application/client/ports/id-generator";

/** {@link IdGenerator} backed by the Web Crypto API's UUID generator. */
export class CryptoIdGenerator implements IdGenerator {
  generate(): string {
    return globalThis.crypto.randomUUID();
  }
}
