import type { Client } from "@backend/domain/client/client";
import type { ClientView } from "./dto";

export function toClientView(client: Client): ClientView {
  return {
    id: client.id,
    name: client.name,
    website: client.website,
    contactName: client.contactName,
    contactEmail: client.contactEmail,
    status: client.status,
    notes: client.notes,
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
  };
}
