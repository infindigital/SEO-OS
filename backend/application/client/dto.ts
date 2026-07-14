import type { ClientStatus } from "@backend/domain/client/client-status";

export interface CreateClientInput {
  name: string;
  website?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  status?: ClientStatus;
  notes?: string | null;
}

export interface UpdateClientInput {
  id: string;
  name?: string;
  website?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  status?: ClientStatus;
  notes?: string | null;
}

export interface ListClientsQuery {
  search?: string;
  status?: ClientStatus;
}

/**
 * Read model returned to the presentation layer. Dates are ISO-8601 strings so
 * the view is trivially serializable across the server/client boundary.
 */
export interface ClientView {
  id: string;
  name: string;
  website: string | null;
  contactName: string | null;
  contactEmail: string | null;
  status: ClientStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}
