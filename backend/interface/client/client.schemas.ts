import { z } from "zod";

import { CLIENT_STATUSES } from "@backend/domain/client/client-status";
import {
  CLIENT_CONTACT_NAME_MAX_LENGTH,
  CLIENT_EMAIL_MAX_LENGTH,
  CLIENT_NAME_MAX_LENGTH,
  CLIENT_NOTES_MAX_LENGTH,
  CLIENT_WEBSITE_MAX_LENGTH,
  isValidEmail,
  isValidWebsite,
} from "@backend/domain/client/client-rules";

export const clientStatusSchema = z.enum(CLIENT_STATUSES);

/**
 * Validation schema for the client form. All fields are strings (empty allowed
 * for optional ones) so it can drive both the client-side form and server-side
 * validation from a single definition.
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
  notes: z
    .string()
    .trim()
    .max(CLIENT_NOTES_MAX_LENGTH, `Notes must be ${CLIENT_NOTES_MAX_LENGTH} characters or fewer.`),
});

export const createClientSchema = clientFormSchema;

export const updateClientSchema = clientFormSchema.extend({
  id: z.uuid("A valid client id is required."),
});

export type ClientFormValues = z.infer<typeof clientFormSchema>;
export type CreateClientPayload = z.infer<typeof createClientSchema>;
export type UpdateClientPayload = z.infer<typeof updateClientSchema>;
