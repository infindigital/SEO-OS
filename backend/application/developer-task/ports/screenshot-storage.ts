/**
 * Port for storing screenshot bytes in object storage. The application layer
 * never touches the storage backend directly.
 */
export interface ScreenshotStorage {
  put(input: {
    key: string;
    bytes: Uint8Array;
    contentType: string;
  }): Promise<{ path: string; url: string | null }>;
}
