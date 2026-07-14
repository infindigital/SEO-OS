import { beforeEach, describe, expect, it } from "vitest";

import { InMemoryClientRepository } from "@backend/infrastructure/client/in-memory-client-repository";
import type { IdGenerator } from "./ports/id-generator";
import { AddClient } from "./use-cases/add-client";
import { EditClient } from "./use-cases/edit-client";
import { DeleteClient } from "./use-cases/delete-client";
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
  let list: ListClients;

  beforeEach(() => {
    repository = new InMemoryClientRepository();
    add = new AddClient(repository, new SequentialIdGenerator());
    edit = new EditClient(repository);
    remove = new DeleteClient(repository);
    list = new ListClients(repository);
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
});
