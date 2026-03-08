import { z } from 'zod';

export const GmailStatusResponseSchema = z.object({
  status: z.enum(['connected', 'not_connected', 'error']),
  message: z.string(),
  google_user_email: z.string().nullable().optional(),
  last_synced_at: z.string().nullable().optional(),
  synced_days: z.number().nullable().optional(),
});

export type GmailStatusResponse = z.infer<typeof GmailStatusResponseSchema>;

export const ConnectGmailResponseSchema = z.object({
  message: z.string(),
  auth_url: z.string(),
});

export type ConnectGmailResponse = z.infer<typeof ConnectGmailResponseSchema>;

export const DisconnectGmailResponseSchema = z.object({
  message: z.string(),
});

export type DisconnectGmailResponse = z.infer<typeof DisconnectGmailResponseSchema>;
