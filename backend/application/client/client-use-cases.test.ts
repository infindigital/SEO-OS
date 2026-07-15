import { beforeEach, describe, expect, it } from "vitest";

import { InMemoryClientRepository } from "@backend/infrastructure/client/in-memory-client-repository";
import type { IdGenerator } from "./ports/id-generator";
import { AddClient } from "./use-cases/add-client";
import { EditClient } from "./use-cases/edit-client";
import { DeleteClient } from "./use-cases/delete-client";
import { ArchiveClient } from "./use-cases/archive-client";
import { GetClient } from "./use-cases/get-client";
import { GetClientPortfolioSummary } from "./use-cases/get-client-portfolio-summary";
import { ListClients } from "./use-cases/list-clients";
import { ClientNotFoundError } from "./client.errors";

class SequentialIdGenerator implements IdGenerator {
  private count = 0;
  generate(): string {
    this.count += 1;
    return `id-${this.count}`;
  }
}

describe("Client use cases", () => {
  let repository: InMemoryClientRepository;
  let add: AddClient;
  let edit: EditClient;
  let remove: DeleteClient;
  let archive: ArchiveClient;
  let get: GetClient;
  let list: ListClients;
  let portfolio: GetClientPortfolioSummary;

  beforeEach(() => {
    repository = new InMemoryClientRepository();
    add = new AddClient(repository, new SequentialIdGenerator());
    edit = new EditClient(repository);
    remove = new DeleteClient(repository);
    archive = new ArchiveClient(repository);
    get = new GetClient(repository);
    list = new ListClients(repository);
    portfolio = new GetClientPortfolioSummary(repository);
  });

  it("adds a client and returns a serializable view", async () => {
    const view = await add.execute({
      name: "Acme",
      status: "ACTIVE",
      contactEmail: "team@acme.com",
    });

    expect(view.id).toBe("id-1");
    expect(view.name).toBe("Acme");
    expect(view.status).toBe("ACTIVE");
    expect(typeof view.createdAt).toBe("string");
  });

  it("filters the list by status and search term", async () => {
    await add.execute({ name: "Acme Corp", status: "ACTIVE", website: "acme.com" });
    await add.execute({ name: "Globex", status: "PROSPECT" });
    await add.execute({
      name: "Initech",
      status: "ACTIVE",
      contactEmail: "ceo@initech.io",
    });

    const active = await list.execute({ status: "ACTIVE" });
    expect(active.map((client) => client.name).sort()).toEqual([
      "Acme Corp",
      "Initech",
    ]);

    const byName = await list.execute({ search: "initech" });
    expect(byName).toHaveLength(1);
    expect(byName[0].name).toBe("Initech");

    const byEmail = await list.execute({ search: "initech.io" });
    expect(byEmail).toHaveLength(1);
    expect(byEmail[0].name).toBe("Initech");
  });

  it("edits an existing client", async () => {
    const created = await add.execute({ name: "Acme" });

    const updated = await edit.execute({
      id: created.id,
      name: "Acme Inc",
      status: "ONBOARDING",
    });

    expect(updated.name).toBe("Acme Inc");
    expect(updated.status).toBe("ONBOARDING");
  });

  it("rejects editing a client that does not exist", async () => {
    await expect(
      edit.execute({ id: "missing", name: "X" }),
    ).rejects.toBeInstanceOf(ClientNotFoundError);
  });

  it("deletes a client", async () => {
    const created = await add.execute({ name: "Acme" });

    await remove.execute(created.id);

    expect(await list.execute()).toHaveLength(0);
  });

  it("rejects deleting a client that does not exist", async () => {
    await expect(remove.execute("missing")).rejects.toBeInstanceOf(
      ClientNotFoundError,
    );
  });

  it("gets a client by id", async () => {
    const created = await add.execute({ name: "Acme", industry: "SaaS" });

    const found = await get.execute(created.id);
    expect(found?.name).toBe("Acme");
    expect(found?.industry).toBe("SaaS");
    expect(await get.execute("missing")).toBeNull();
  });

  it("persists the portfolio fields end to end", async () => {
    const created = await add.execute({
      name: "Acme",
      ownerId: "owner-1",
      industry: "Retail",
      monthlyRetainer: 3000,
      seoScore: 65,
      lastAuditAt: new Date("2026-03-01T00:00:00.000Z"),
      currentFocus: "Content",
    });

    expect(created.monthlyRetainer).toBe(3000);
    expect(created.seoScore).toBe(65);
    expect(created.ownerId).toBe("owner-1");
    expect(created.lastAuditAt).toBe("2026-03-01T00:00:00.000Z");
    expect(created.currentFocus).toBe("Content");
  });

  it("archives and restores, hiding archived clients by default", async () => {
    const created = await add.execute({ name: "Acme" });

    const archived = await archive.execute(created.id, true);
    expect(archived.isArchived).toBe(true);

    expect(await list.execute()).toHaveLength(0);
    expect(await list.execute({ archivedOnly: true })).toHaveLength(1);
    expect(await list.execute({ includeArchived: true })).toHaveLength(1);

    const restored = await archive.execute(created.id, false);
    expect(restored.isArchived).toBe(false);
    expect(await list.execute()).toHaveLength(1);
  });

  it("rejects archiving a client that does not exist", async () => {
    await expect(archive.execute("missing", true)).rejects.toBeInstanceOf(
      ClientNotFoundError,
    );
  });

  it("computes portfolio KPIs over active (non-archived) clients", async () => {
    const now = new Date("2026-04-01T00:00:00.000Z");
    await add.execute({
      name: "Acme",
      status: "ACTIVE",
      monthlyRetainer: 2000,
      seoScore: 80,
      lastAuditAt: new Date("2026-03-25T00:00:00.000Z"),
    });
    await add.execute({
      name: "Globex",
      status: "PROSPECT",
      monthlyRetainer: 1000,
      seoScore: 40,
      // No lastAuditAt → needs audit.
    });
    const archivedClient = await add.execute({
      name: "Initech",
      status: "ACTIVE",
      monthlyRetainer: 5000,
    });
    await archive.execute(archivedClient.id, true);

    const summary = await portfolio.execute(now);

    expect(summary.totalClients).toBe(2);
    expect(summary.activeClients).toBe(1);
    expect(summary.totalMonthlyRetainer).toBe(3000);
    expect(summary.averageSeoScore).toBe(60);
    expect(summary.clientsNeedingAudit).toBe(1);
  });
});
