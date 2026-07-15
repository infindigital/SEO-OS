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
    ownerId: client.ownerId,
    industry: client.industry,
    monthlyRetainer: client.monthlyRetainer,
    seoScore: client.seoScore,
    lastAuditAt: client.lastAuditAt ? client.lastAuditAt.toISOString() : null,
    currentFocus: client.currentFocus,
    notes: client.notes,
    archivedAt: client.archivedAt ? client.archivedAt.toISOString() : null,
    isArchived: client.isArchived,
    createdAt: client.createdAt.toISOString(),
    updatedAt: client.updatedAt.toISOString(),
  };
}
