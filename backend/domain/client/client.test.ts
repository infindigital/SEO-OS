import { describe, expect, it } from "vitest";

import { Client } from "./client";
import {
  InvalidClientEmailError,
  InvalidClientNameError,
  InvalidClientWebsiteError,
} from "./client.errors";

describe("Client entity", () => {
  it("creates a client with normalized values", () => {
    const client = Client.create({
      id: "id-1",
      name: "  Acme  ",
      website: "example.com",
      contactName: "  Jane  ",
      contactEmail: "  JANE@Example.com ",
      notes: "   ",
    });

    expect(client.name).toBe("Acme");
    expect(client.website).toBe("https://example.com/");
    expect(client.contactName).toBe("Jane");
    expect(client.contactEmail).toBe("jane@example.com");
    expect(client.notes).toBeNull();
    expect(client.status).toBe("PROSPECT");
  });

  it("rejects a blank name", () => {
    expect(() => Client.create({ id: "id-1", name: "   " })).toThrow(
      InvalidClientNameError,
    );
  });

  it("rejects an invalid email", () => {
    expect(() =>
      Client.create({ id: "id-1", name: "Acme", contactEmail: "not-an-email" }),
    ).toThrow(InvalidClientEmailError);
  });

  it("rejects an invalid website", () => {
    expect(() =>
      Client.create({ id: "id-1", name: "Acme", website: "not a website" }),
    ).toThrow(InvalidClientWebsiteError);
  });

  it("applies partial updates and bumps updatedAt", () => {
    const client = Client.create({
      id: "id-1",
      name: "Acme",
      createdAt: new Date("2020-01-01T00:00:00.000Z"),
    });
    const before = client.updatedAt.getTime();

    client.update({ status: "ACTIVE", contactEmail: "team@acme.com" });

    expect(client.status).toBe("ACTIVE");
    expect(client.contactEmail).toBe("team@acme.com");
    expect(client.updatedAt.getTime()).toBeGreaterThan(before);
  });
});
