import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { PlaywrightPageFetcher } from "./playwright-page-fetcher";

const HTML = `<!doctype html>
<html lang="en">
  <head>
    <title>Home | Test Site</title>
    <meta name="description" content="A page for testing the crawler." />
    <meta name="robots" content="index,follow" />
    <link rel="canonical" href="/" />
    <script type="application/ld+json">
      { "@context": "https://schema.org", "@type": "Organization", "name": "Test" }
    </script>
  </head>
  <body>
    <h1>Main heading</h1>
    <h2>Section one</h2>
    <h2>Section two</h2>
    <p>one two three four five six</p>
    <img src="/a.png" alt="described" />
    <img src="/b.png" />
    <img src="/c.png" alt="" />
    <a href="/about">About</a>
    <a href="https://external.example.com/page">External</a>
  </body>
</html>`;

let server: Server;
let port: number;
let fetcher: PlaywrightPageFetcher;

beforeAll(async () => {
  server = createServer((_req, res) => {
    res.writeHead(200, { "content-type": "text/html" });
    res.end(HTML);
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  port = (server.address() as AddressInfo).port;

  fetcher = new PlaywrightPageFetcher({
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
  });
  await fetcher.init();
});

afterAll(async () => {
  await fetcher.close();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

describe("PlaywrightPageFetcher (crawler)", () => {
  it("extracts SEO fields from a live page", async () => {
    const result = await fetcher.fetch(`http://127.0.0.1:${port}/`);

    expect(result.statusCode).toBe(200);
    expect(result.error).toBeNull();
    expect(result.responseTimeMs).toBeGreaterThan(0);
    expect(result.redirectChain).toEqual([]);
    expect(Array.isArray(result.images)).toBe(true);

    const data = result.data;
    expect(data).not.toBeNull();
    if (!data) return;

    expect(data.title).toBe("Home | Test Site");
    expect(data.metaDescription).toBe("A page for testing the crawler.");
    expect(data.metaRobots).toBe("index,follow");
    expect(data.canonical).toBe(`http://127.0.0.1:${port}/`);
    expect(data.h1).toEqual(["Main heading"]);
    expect(data.h2).toEqual(["Section one", "Section two"]);
    expect(data.imageCount).toBe(3);
    expect(data.imagesMissingAlt).toBe(2);
    expect(data.schemaTypes).toContain("Organization");
    expect(data.links.some((l) => l.endsWith("/about"))).toBe(true);
    expect(data.links.some((l) => l.includes("external.example.com"))).toBe(true);
    expect(data.text).toContain("one two three four five six");
  });
});
