import type { ClientRepository } from "@backend/application/client/ports/client-repository";

export interface ResolvedClient {
  id: string;
  name: string;
}

/** Resolve the client a portal user belongs to, by their contact email. */
export class ResolveClientForEmail {
  constructor(private readonly clients: ClientRepository) {}

  async execute(email: string): Promise<ResolvedClient | null> {
    const client = await this.clients.findByContactEmail(email);
    return client ? { id: client.id, name: client.name } : null;
  }
}
