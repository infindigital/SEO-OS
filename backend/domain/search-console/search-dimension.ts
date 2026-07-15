/** Search-analytics dimensions we store (kept in sync with the Prisma enum). */
export const SEARCH_DIMENSIONS = ["QUERY", "PAGE"] as const;

export type SearchDimension = (typeof SEARCH_DIMENSIONS)[number];

export function isSearchDimension(value: unknown): value is SearchDimension {
  return (
    typeof value === "string" &&
    (SEARCH_DIMENSIONS as readonly string[]).includes(value)
  );
}
