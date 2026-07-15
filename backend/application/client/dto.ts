import type { ClientStatus } from "@backend/domain/client/client-status";

export interface CreateClientInput {
  name: string;
  website?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  status?: ClientStatus;
  ownerId?: string | null;
  industry?: string | null;
  monthlyRetainer?: number | null;
  seoScore?: number | null;
  lastAuditAt?: Date | null;
  currentFocus?: string | null;
  notes?: string | null;
}

export interface UpdateClientInput {
  id: string;
  name?: string;
  website?: string | null;
  contactName?: string | null;
  contactEmail?: string | null;
  status?: ClientStatus;
  ownerId?: string | null;
  industry?: string | null;
  monthlyRetainer?: number | null;
  seoScore?: number | null;
  lastAuditAt?: Date | null;
  currentFocus?: string | null;
  notes?: string | null;
}

export interface ListClientsQuery {
  search?: string;
  status?: ClientStatus;
  /** When false or omitted, archived clients are excluded. */
  includeArchived?: boolean;
  /** When true, return only archived clients. */
  archivedOnly?: boolean;
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
  ownerId: string | null;
  industry: string | null;
  monthlyRetainer: number | null;
  seoScore: number | null;
  lastAuditAt: string | null;
  currentFocus: string | null;
  notes: string | null;
  archivedAt: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClientPortfolioSummary {
  totalClients: number;
  activeClients: number;
  totalMonthlyRetainer: number;
  averageSeoScore: number | null;
  clientsNeedingAudit: number;
}
