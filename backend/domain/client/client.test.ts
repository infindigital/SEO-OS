import { describe, expect, it } from "vitest";

import { Client } from "./client";
import {
  InvalidClientEmailError,
  InvalidClientNameError,
  InvalidClientRetainerError,
  InvalidClientSeoScoreError,
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

  it("stores portfolio fields and normalizes blanks to null", () => {
    const audit = new Date("2026-01-15T00:00:00.000Z");
    const client = Client.create({
      id: "id-1",
      name: "Acme",
      ownerId: "owner-1",
      industry: "  E-commerce  ",
      monthlyRetainer: 2500,
      seoScore: 72,
      lastAuditAt: audit,
      currentFocus: "   ",
    });

    expect(client.ownerId).toBe("owner-1");
    expect(client.industry).toBe("E-commerce");
    expect(client.monthlyRetainer).toBe(2500);
    expect(client.seoScore).toBe(72);
    expect(client.lastAuditAt).toEqual(audit);
    expect(client.currentFocus).toBeNull();
    expect(client.isArchived).toBe(false);
  });

  it("rejects a negative or fractional retainer", () => {
    expect(() =>
      Client.create({ id: "id-1", name: "Acme", monthlyRetainer: -1 }),
    ).toThrow(InvalidClientRetainerError);
    expect(() =>
      Client.create({ id: "id-1", name: "Acme", monthlyRetainer: 10.5 }),
    ).toThrow(InvalidClientRetainerError);
  });

  it("rejects an SEO score outside 0–100", () => {
    expect(() =>
      Client.create({ id: "id-1", name: "Acme", seoScore: 101 }),
    ).toThrow(InvalidClientSeoScoreError);
    expect(() =>
      Client.create({ id: "id-1", name: "Acme", seoScore: -5 }),
    ).toThrow(InvalidClientSeoScoreError);
  });

  it("archives and restores a client", () => {
    const client = Client.create({ id: "id-1", name: "Acme" });

    client.archive(new Date("2026-02-01T00:00:00.000Z"));
    expect(client.isArchived).toBe(true);
    expect(client.archivedAt).toEqual(new Date("2026-02-01T00:00:00.000Z"));

    client.unarchive();
    expect(client.isArchived).toBe(false);
    expect(client.archivedAt).toBeNull();
  });
});
