import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string()
    .min(5)
    .regex(/^[a-zA-Z0-9_]*$/),
  email: z.email(),
  password: z.string().min(8),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export type RegisterCredentials = z.infer<typeof registerSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;
