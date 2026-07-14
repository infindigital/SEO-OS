import { z } from "zod";

import { USER_ROLES } from "@backend/domain/auth/user-role";
import { isValidEmail } from "@backend/domain/shared/email";

const emailField = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .refine(isValidEmail, "Enter a valid email address.");

export const signInSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Password is required."),
});

export const signUpSchema = z.object({
  email: emailField,
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const updateRoleSchema = z.object({
  userId: z.uuid("A valid user id is required."),
  role: z.enum(USER_ROLES),
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
