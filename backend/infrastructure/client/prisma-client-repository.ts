import type { PrismaClient, Prisma } from "@prisma/client";
import type { Client } from "@backend/domain/client/client";
import type { ClientRepository } from "@backend/application/client/ports/client-repository";
import type { ListClientsQuery } from "@backend/application/client/dto";
import { toDomain } from "./client.mapper";

/** Prisma-backed implementation of the {@link ClientRepository} port. */
export class PrismaClientRepository implements ClientRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(client: Client): Promise<void> {
    await this.prisma.client.create({ data: this.toData(client) });
  }

  async update(client: Client): Promise<void> {
    await this.prisma.client.update({
      where: { id: client.id },
      data: {
        name: client.name,
        website: client.website,
        contactName: client.contactName,
        contactEmail: client.contactEmail,
        status: client.status,
        ownerId: client.ownerId,
        industry: client.industry,
        monthlyRetainer: client.monthlyRetainer,
        seoScore: client.seoScore,
        lastAuditAt: client.lastAuditAt,
        currentFocus: client.currentFocus,
        notes: client.notes,
        archivedAt: client.archivedAt,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.client.delete({ where: { id } });
  }

  async findById(id: string): Promise<Client | null> {
    const record = await this.prisma.client.findUnique({ where: { id } });
    return record ? toDomain(record) : null;
  }

  async findByContactEmail(email: string): Promise<Client | null> {
    const record = await this.prisma.client.findFirst({
      where: {
        contactEmail: { equals: email, mode: "insensitive" },
        archivedAt: null,
      },
      orderBy: { createdAt: "asc" },
    });
    return record ? toDomain(record) : null;
  }

  async list(query: ListClientsQuery): Promise<Client[]> {
    const where: Prisma.ClientWhereInput = {};

    if (query.archivedOnly) {
      where.archivedAt = { not: null };
    } else if (!query.includeArchived) {
      where.archivedAt = null;
    }

    if (query.status) {
      where.status = query.status;
    }

    const search = query.search?.trim();
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { website: { contains: search, mode: "insensitive" } },
        { contactName: { contains: search, mode: "insensitive" } },
        { contactEmail: { contains: search, mode: "insensitive" } },
        { industry: { contains: search, mode: "insensitive" } },
        { currentFocus: { contains: search, mode: "insensitive" } },
      ];
    }

    const records = await this.prisma.client.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    return records.map(toDomain);
  }

  private toData(client: Client): Prisma.ClientUncheckedCreateInput {
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
      lastAuditAt: client.lastAuditAt,
      currentFocus: client.currentFocus,
      notes: client.notes,
      archivedAt: client.archivedAt,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    };
  }
}
