import { z } from "zod";

import {
  REPORT_SUMMARY_MAX_LENGTH,
  REPORT_TITLE_MAX_LENGTH,
} from "@backend/domain/client-report/client-report";

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export const publishReportSchema = z.object({
  clientId: z.uuid("A valid client is required."),
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(REPORT_TITLE_MAX_LENGTH, `Title must be ${REPORT_TITLE_MAX_LENGTH} characters or fewer.`),
  period: z.string().trim().max(100, "Period is too long."),
  summary: z
    .string()
    .trim()
    .max(REPORT_SUMMARY_MAX_LENGTH, `Summary must be ${REPORT_SUMMARY_MAX_LENGTH} characters or fewer.`),
  url: z
    .string()
    .trim()
    .refine((value) => value === "" || isHttpUrl(value), {
      message: "Enter a valid URL, e.g. https://example.com/report.pdf.",
    }),
});

export type PublishReportPayload = z.infer<typeof publishReportSchema>;
