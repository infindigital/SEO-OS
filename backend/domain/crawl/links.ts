import { getHost, normalizeUrl } from "./url";

export interface ClassifiedLinks {
  internal: string[];
  external: string[];
}

/**
 * Split a set of raw hrefs into internal (same host) and external links,
 * normalized to absolute http(s) URLs and de-duplicated. Non-web links (mailto,
 * tel, javascript, etc.) are discarded.
 */
export function classifyLinks(
  links: string[],
  host: string,
  base: string,
): ClassifiedLinks {
  const internal = new Set<string>();
  const external = new Set<string>();
  const normalizedHost = host.toLowerCase();

  for (const link of links) {
    const normalized = normalizeUrl(link, base);
    if (!normalized) {
      continue;
    }
    const linkHost = getHost(normalized);
    if (linkHost === null) {
      continue;
    }
    if (linkHost === normalizedHost) {
      internal.add(normalized);
    } else {
      external.add(normalized);
    }
  }

  return { internal: [...internal], external: [...external] };
}
