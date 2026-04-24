import { z } from 'zod';

export const CurrencySchema = z.enum(['VND', 'USD', 'EUR', 'GBP', 'JPY', 'SGD', 'AUD']);
export type Currency = z.infer<typeof CurrencySchema>;

export const TransactionSchema = z.object({
  id: z.string(),
  type: z.enum(['income', 'expense']),
  name: z.string().min(1),
  amount: z.number().int().positive(), // smallest currency unit (VND đồng, US cents, etc.)
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  category: z.string(),
  notes: z.string().optional(),
  recurring: z.boolean(),
  recurringUntil: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
export type Transaction = z.infer<typeof TransactionSchema>;

export const NewTransactionSchema = TransactionSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type NewTransaction = z.infer<typeof NewTransactionSchema>;

export const TransactionPatchSchema = NewTransactionSchema.partial();
export type TransactionPatch = z.infer<typeof TransactionPatchSchema>;

export const TransactionFiltersSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  type: z.enum(['income', 'expense']).optional(),
  category: z.string().optional(),
  dateFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dateTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});
export type TransactionFilters = z.infer<typeof TransactionFiltersSchema>;

export const CategoryDefinitionSchema = z.object({
  id: z.string(),
  kind: z.enum(['income', 'expense']),
  label: z.string().min(1),
  isDefault: z.boolean(),
  displayOrder: z.number().int().nonnegative(),
});
export type CategoryDefinition = z.infer<typeof CategoryDefinitionSchema>;

export const InvestmentPlanSchema = z.object({
  ratio: z.number().min(0).max(1),
  durationYears: z.number().int().min(1).max(30),
  projectionHorizonYears: z.literal(30),
  seed: z.string(),
});
export type InvestmentPlan = z.infer<typeof InvestmentPlanSchema>;

export const StockDefinitionSchema = z.object({
  ticker: z.string(),
  name: z.string(),
  mu: z.number(),
  sigma: z.number().nonnegative(),
  isUserOverridden: z.boolean(),
});
export type StockDefinition = z.infer<typeof StockDefinitionSchema>;

export const UserSettingsSchema = z.object({
  currency: CurrencySchema,
  theme: z.enum(['light', 'dark', 'system']),
  investmentPlan: InvestmentPlanSchema,
  stocks: z.array(StockDefinitionSchema).min(5).max(5),
});
export type UserSettings = z.infer<typeof UserSettingsSchema>;
