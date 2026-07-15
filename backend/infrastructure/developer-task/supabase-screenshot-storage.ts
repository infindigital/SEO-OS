import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ScreenshotStorage } from "@backend/application/developer-task/ports/screenshot-storage";

/**
 * Supabase Storage implementation of {@link ScreenshotStorage}. Uploads bytes
 * to a bucket and returns the object's path plus its public URL.
 *
 * The bucket (default `task-screenshots`) must exist in the Supabase project.
 */
export class SupabaseScreenshotStorage implements ScreenshotStorage {
  constructor(private readonly bucket: string = "task-screenshots") {}

  async put(input: {
    key: string;
    bytes: Uint8Array;
    contentType: string;
  }): Promise<{ path: string; url: string | null }> {
    const supabase = await createSupabaseServerClient();

    const { error } = await supabase.storage
      .from(this.bucket)
      .upload(input.key, input.bytes, {
        contentType: input.contentType,
        upsert: false,
      });

    if (error) {
      throw new Error(`Screenshot upload failed: ${error.message}`);
    }

    const { data } = supabase.storage.from(this.bucket).getPublicUrl(input.key);
    return { path: input.key, url: data.publicUrl ?? null };
  }
}
