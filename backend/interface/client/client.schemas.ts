import { z } from "zod";

import { CLIENT_STATUSES } from "@backend/domain/client/client-status";
import {
  CLIENT_CONTACT_NAME_MAX_LENGTH,
  CLIENT_CURRENT_FOCUS_MAX_LENGTH,
  CLIENT_EMAIL_MAX_LENGTH,
  CLIENT_INDUSTRY_MAX_LENGTH,
  CLIENT_MAX_MONTHLY_RETAINER,
  CLIENT_MAX_SEO_SCORE,
  CLIENT_MIN_SEO_SCORE,
  CLIENT_NAME_MAX_LENGTH,
  CLIENT_NOTES_MAX_LENGTH,
  CLIENT_WEBSITE_MAX_LENGTH,
  isValidEmail,
  isValidWebsite,
} from "@backend/domain/client/client-rules";

export const clientStatusSchema = z.enum(CLIENT_STATUSES);

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const INTEGER_PATTERN = /^\d+$/;

/** Reject a YYYY-MM-DD string that names a day that doesn't exist. */
function isRealDate(value: string): boolean {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Validation schema for the client form. All fields are strings (empty allowed
 * for optional ones) so it can drive both the client-side form and server-side
 * validation from a single definition. Numeric and date fields are validated as
 * strings here and coerced to their domain types in the controller.
 */
export const clientFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required.")
    .max(CLIENT_NAME_MAX_LENGTH, `Name must be ${CLIENT_NAME_MAX_LENGTH} characters or fewer.`),
  website: z
    .string()
    .trim()
    .max(CLIENT_WEBSITE_MAX_LENGTH, "Website is too long.")
    .refine((value) => value === "" || isValidWebsite(value), {
      message: "Enter a valid website, e.g. example.com.",
    }),
  contactName: z
    .string()
    .trim()
    .max(
      CLIENT_CONTACT_NAME_MAX_LENGTH,
      `Contact name must be ${CLIENT_CONTACT_NAME_MAX_LENGTH} characters or fewer.`,
    ),
  contactEmail: z
    .string()
    .trim()
    .max(CLIENT_EMAIL_MAX_LENGTH, "Email is too long.")
    .refine((value) => value === "" || isValidEmail(value), {
      message: "Enter a valid email address.",
    }),
  status: clientStatusSchema,
  ownerId: z
    .string()
    .trim()
    .refine((value) => value === "" || UUID_PATTERN.test(value), {
      message: "Select a valid owner.",
    }),
  industry: z
    .string()
    .trim()
    .max(
      CLIENT_INDUSTRY_MAX_LENGTH,
      `Industry must be ${CLIENT_INDUSTRY_MAX_LENGTH} characters or fewer.`,
    ),
  monthlyRetainer: z
    .string()
    .trim()
    .refine((value) => value === "" || INTEGER_PATTERN.test(value), {
      message: "Enter a whole, non-negative amount.",
    })
    .refine(
      (value) => value === "" || Number(value) <= CLIENT_MAX_MONTHLY_RETAINER,
      { message: "Retainer is too large." },
    ),
  seoScore: z
    .string()
    .trim()
    .refine((value) => value === "" || INTEGER_PATTERN.test(value), {
      message: "Enter a whole number.",
    })
    .refine(
      (value) =>
        value === "" ||
        (Number(value) >= CLIENT_MIN_SEO_SCORE &&
          Number(value) <= CLIENT_MAX_SEO_SCORE),
      {
        message: `Score must be between ${CLIENT_MIN_SEO_SCORE} and ${CLIENT_MAX_SEO_SCORE}.`,
      },
    ),
  lastAuditDate: z
    .string()
    .trim()
    .refine((value) => value === "" || DATE_PATTERN.test(value), {
      message: "Use the date picker to choose a valid date.",
    })
    .refine((value) => value === "" || isRealDate(value), {
      message: "That date does not exist.",
    }),
  currentFocus: z
    .string()
    .trim()
    .max(
      CLIENT_CURRENT_FOCUS_MAX_LENGTH,
      `Current focus must be ${CLIENT_CURRENT_FOCUS_MAX_LENGTH} characters or fewer.`,
    ),
  notes: z
    .string()
    .trim()
    .max(CLIENT_NOTES_MAX_LENGTH, `Notes must be ${CLIENT_NOTES_MAX_LENGTH} characters or fewer.`),
});

export const createClientSchema = clientFormSchema;

export const updateClientSchema = clientFormSchema.extend({
  id: z.uuid("A valid client id is required."),
});

export const archiveClientSchema = z.object({
  id: z.uuid("A valid client id is required."),
  archived: z.boolean(),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;
export type CreateClientPayload = z.infer<typeof createClientSchema>;
export type UpdateClientPayload = z.infer<typeof updateClientSchema>;
export type ArchiveClientPayload = z.infer<typeof archiveClientSchema>;
