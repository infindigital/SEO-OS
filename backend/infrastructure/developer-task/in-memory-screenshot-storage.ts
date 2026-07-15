import type { ScreenshotStorage } from "@backend/application/developer-task/ports/screenshot-storage";

/** In-memory {@link ScreenshotStorage} for unit tests. */
export class InMemoryScreenshotStorage implements ScreenshotStorage {
  readonly stored = new Map<string, { bytes: Uint8Array; contentType: string }>();

  async put(input: {
    key: string;
    bytes: Uint8Array;
    contentType: string;
  }): Promise<{ path: string; url: string | null }> {
    this.stored.set(input.key, {
      bytes: input.bytes,
      contentType: input.contentType,
    });
    return { path: input.key, url: `memory://${input.key}` };
  }
}
