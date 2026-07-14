/** Count words in a block of text by collapsing whitespace. */
export function countWords(text: string): number {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length === 0) {
    return 0;
  }
  return normalized.split(" ").length;
}
