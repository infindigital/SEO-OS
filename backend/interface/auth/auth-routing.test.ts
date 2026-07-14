import { describe, expect, it } from "vitest";

import { resolveAuthAction } from "./auth-routing";

describe("resolveAuthAction", () => {
  it("lets an authenticated user proceed on a protected route", () => {
    expect(resolveAuthAction("/clients", true)).toEqual({ type: "next" });
  });

  it("redirects an unauthenticated user from a protected route to login", () => {
    expect(resolveAuthAction("/clients", false)).toEqual({
      type: "redirect",
      to: "/login",
      redirectTo: "/clients",
    });
  });

  it("redirects an authenticated user away from auth routes", () => {
    expect(resolveAuthAction("/login", true)).toEqual({
      type: "redirect",
      to: "/dashboard",
    });
    expect(resolveAuthAction("/signup", true)).toEqual({
      type: "redirect",
      to: "/dashboard",
    });
  });

  it("allows public routes without authentication", () => {
    expect(resolveAuthAction("/", false)).toEqual({ type: "next" });
    expect(resolveAuthAction("/login", false)).toEqual({ type: "next" });
    expect(resolveAuthAction("/forbidden", false)).toEqual({ type: "next" });
  });
});
