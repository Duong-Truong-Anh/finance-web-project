import { z } from 'zod';

export const tickerSelectionSchema = z.object({
  symbol: z.string().min(1).max(20),
  description: z.string().max(120),
  exchange: z.string().nullable(),
  pickedAt: z.string().datetime(),
});

export const portfolioConfigSchema = z.object({
  ratio: z.number().min(0.30).max(0.50),
  tickers: z.array(tickerSelectionSchema).max(5),
  updatedAt: z.string().datetime(),
});

export type TickerSelection = z.infer<typeof tickerSelectionSchema>;
export type PortfolioConfig = z.infer<typeof portfolioConfigSchema>;
