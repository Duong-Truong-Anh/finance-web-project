import { z } from 'zod';

export const ASSET_CLASSES = ['stocks', 'savings', 'cash', 'gold', 'usd'] as const;
export type AssetClass = (typeof ASSET_CLASSES)[number];
export type AssetAllocation = Record<AssetClass, number>;

// Fixed allocation per teacher clarification (2026-05-10). Runtime value must equal this constant.
// Zod schema enforces each literal; no UI surface allows editing.
// Note: sums to 0.90 (stocks 50% + 4 non-stocks × 10%).
export const ASSET_ALLOCATION = {
  stocks:  0.50,
  savings: 0.10,
  cash:    0.10,
  gold:    0.10,
  usd:     0.10,
} as const satisfies AssetAllocation;

const assetAllocationSchema = z.object({
  stocks:  z.literal(0.50),
  savings: z.literal(0.10),
  cash:    z.literal(0.10),
  gold:    z.literal(0.10),
  usd:     z.literal(0.10),
});

export const tickerSelectionSchema = z.object({
  symbol:      z.string().min(1).max(20),
  description: z.string().max(120),
  exchange:    z.string().nullable(),
  pickedAt:    z.string().datetime(),
});

export const portfolioConfigSchema = z.object({
  allocation: assetAllocationSchema,
  tickers:    z.array(tickerSelectionSchema).max(5),
  updatedAt:  z.string().datetime(),
});

export type TickerSelection  = z.infer<typeof tickerSelectionSchema>;
export type PortfolioConfig  = z.infer<typeof portfolioConfigSchema>;
