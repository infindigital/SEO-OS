import type { PrismaClient, Prisma } from "@prisma/client";
import type { Profile } from "@backend/domain/auth/profile";
import type { ProfileRepository } from "@backend/application/auth/ports/profile-repository";
import { toDomain } from "./profile.mapper";

/** Prisma-backed implementation of the {@link ProfileRepository} port. */
export class PrismaProfileRepository implements ProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(profile: Profile): Promise<void> {
    await this.prisma.profile.create({ data: this.toData(profile) });
  }

  async update(profile: Profile): Promise<void> {
    await this.prisma.profile.update({
      where: { id: profile.id },
      data: { email: profile.email, role: profile.role },
    });
  }

  async findById(id: string): Promise<Profile | null> {
    const record = await this.prisma.profile.findUnique({ where: { id } });
    return record ? toDomain(record) : null;
  }

  async findByEmail(email: string): Promise<Profile | null> {
    const record = await this.prisma.profile.findUnique({ where: { email } });
    return record ? toDomain(record) : null;
  }

  async list(): Promise<Profile[]> {
    const records = await this.prisma.profile.findMany({
      orderBy: { createdAt: "asc" },
    });
    return records.map(toDomain);
  }

  private toData(profile: Profile): Prisma.ProfileUncheckedCreateInput {
    return {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    };
  }
}
