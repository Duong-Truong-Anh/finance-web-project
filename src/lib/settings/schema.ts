import { z } from 'zod';

export const settingsSchema = z.object({
  displayCurrency: z.enum(['VND', 'USD']),
  theme: z.enum(['g90', 'g100', 'white']),
  finnhubKey: z.string().nullable(),
  fxAutoRefresh: z.boolean(),
  schemaVersion: z.literal(1),
});

export type Settings = z.infer<typeof settingsSchema>;
export type Theme = Settings['theme'];
