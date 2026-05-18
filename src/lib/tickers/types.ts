export type TickerSearchResult = {
  symbol: string;
  description: string;
  exchange: string | null;
  type: string;
};

export type SearchErrorCode =
  | 'no-key'
  | 'invalid-key'
  | 'rate-limited'
  | 'network'
  | 'unknown';

export type SearchResponse =
  | { ok: true; results: TickerSearchResult[] }
  | { ok: false; error: SearchErrorCode };

export type FinnhubResult = {
  symbol: string;
  description: string;
  displaySymbol: string;
  type: string;
};
