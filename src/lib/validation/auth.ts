import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100, "Name is too long."),
  email: z.string().trim().toLowerCase().min(1, "Email is required.").email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters.").max(200, "Password is too long."),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const signinSchema = z.object({
  email: z.string().trim().toLowerCase().min(1, "Email is required.").email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});
export type SigninInput = z.infer<typeof signinSchema>;
