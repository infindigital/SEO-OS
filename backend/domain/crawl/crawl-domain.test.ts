import { describe, expect, it } from "vitest";

import { countWords } from "./text";
import { classifyLinks } from "./links";
import { getHost, isHttpUrl, normalizeUrl } from "./url";

describe("url helpers", () => {
  it("recognizes http(s) URLs", () => {
    expect(isHttpUrl("https://example.com")).toBe(true);
    expect(isHttpUrl("mailto:a@b.com")).toBe(false);
    expect(isHttpUrl("not a url")).toBe(false);
  });

  it("normalizes relative URLs against a base and strips the fragment", () => {
    expect(normalizeUrl("/about#team", "https://example.com/home")).toBe(
      "https://example.com/about",
    );
    expect(normalizeUrl("mailto:a@b.com")).toBeNull();
  });

  it("extracts the lowercased host", () => {
    expect(getHost("https://Example.com/path")).toBe("example.com");
    expect(getHost("nonsense")).toBeNull();
  });
});

describe("countWords", () => {
  it("counts words ignoring extra whitespace", () => {
    expect(countWords("  one two   three\nfour ")).toBe(4);
    expect(countWords("   ")).toBe(0);
  });
});

describe("classifyLinks", () => {
  it("splits internal and external links, normalized and de-duplicated", () => {
    const { internal, external } = classifyLinks(
      [
        "/about",
        "https://example.com/about#top",
        "https://example.com/contact",
        "https://other.com/x",
        "mailto:hi@example.com",
      ],
      "example.com",
      "https://example.com/",
    );

    expect(internal.sort()).toEqual([
      "https://example.com/about",
      "https://example.com/contact",
    ]);
    expect(external).toEqual(["https://other.com/x"]);
  });
});
