import type { Client as ClientRecord } from "@prisma/client";
import { Client } from "@backend/domain/client/client";
import type { ClientStatus } from "@backend/domain/client/client-status";

/** Map a Prisma record into a domain entity. */
export function toDomain(record: ClientRecord): Client {
  return Client.reconstitute({
    id: record.id,
    name: record.name,
    website: record.website,
    contactName: record.contactName,
    contactEmail: record.contactEmail,
    status: record.status as ClientStatus,
    ownerId: record.ownerId,
    industry: record.industry,
    monthlyRetainer: record.monthlyRetainer,
    seoScore: record.seoScore,
    lastAuditAt: record.lastAuditAt,
    currentFocus: record.currentFocus,
    notes: record.notes,
    archivedAt: record.archivedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}
