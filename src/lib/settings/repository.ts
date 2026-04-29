import type { Currency } from '../currency/types';

export type Theme = 'g90' | 'g100' | 'white';

export type Settings = {
  displayCurrency: Currency;
  theme: Theme;
  finnhubKey: string | null;
  fxAutoRefresh: boolean;
  schemaVersion: number; // current: 1
};

export interface SettingsRepository {
  get(): Promise<Settings>;
  set(value: Settings): Promise<void>;
}
