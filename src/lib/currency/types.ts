export type Currency = 'VND' | 'USD';

export type Money = {
  amount: number; // Integer. Minor units of the stored currency.
  currency: Currency;
};

export type IsoDate = string; // 'YYYY-MM-DD'
export type IsoDateTime = string; // 'YYYY-MM-DDTHH:mm:ssZ'
export type YearMonth = `${number}-${number}`; // 'YYYY-MM'

export type FxRateSnapshot = {
  base: 'USD';
  rates: { VND: number; USD: number }; // USD is always 1; included for symmetry
  fetchedAt: IsoDateTime;
};
