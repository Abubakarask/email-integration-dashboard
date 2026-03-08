import { z } from 'zod';

// Define the response from the API for a User
export const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  email_verified_at: z.string().nullable().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;

export const LoginRequestSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginRequest = z.infer<typeof LoginRequestSchema>;

export const AuthResponseSchema = z.object({
  user: UserSchema.optional(),
  access_token: z.string().optional(),
  token_type: z.string().optional(),
  message: z.string().optional(),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;
