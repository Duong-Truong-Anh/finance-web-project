import type { IsoDateTime } from '../currency/types';

export type TickerSelection = {
  symbol: string;
  description: string;
  exchange: string | null;
  pickedAt: IsoDateTime;
};

export type PortfolioConfig = {
  ratio: number; // 0.30..0.50
  tickers: TickerSelection[]; // length up to 5
  updatedAt: IsoDateTime;
};

export interface PortfolioConfigRepository {
  get(): Promise<PortfolioConfig>;
  set(value: PortfolioConfig): Promise<void>;
}
