'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FocusEvent } from 'react';
import { Button, ComboBox, SkeletonText, Tag } from '@carbon/react';
import { ArrowDown, ArrowUp, Information, Renew } from '@carbon/icons-react';
import type {
  QuoteErrorCode,
  TickerSearchResult,
} from '@/src/lib/tickers';
import type { TickerSelection } from '@/src/lib/portfolio';
import type { Currency } from '@/src/lib/currency/types';
import { format, type Locale } from '@/src/lib/currency/format';
import { useTickerSearch } from './useTickerSearch';
import { useTickerQuote, type QuoteState } from './useTickerQuote';

interface Props {
  index: number;
  selection: TickerSelection | null;
  finnhubKey: string | null;
  onCommit: (selection: TickerSelection | null) => void;
}

function useDebouncedCallback<A extends unknown[]>(
  fn: (...args: A) => unknown,
  delay: number,
): (...args: A) => void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  }, [fn]);
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );
  return useCallback(
    (...args: A) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => fnRef.current(...args), delay);
    },
    [delay],
  );
}

function nowIso(): string {
  return new Date().toISOString();
}

function itemToString(r: TickerSearchResult | null): string {
  if (!r) return '';
  return r.description ? `${r.symbol}  ·  ${r.description}` : r.symbol;
}

function inferTickerCurrency(symbol: string): Currency {
  return symbol.endsWith('.HM') || symbol.endsWith('.HN') ? 'VND' : 'USD';
}

function formatNativePrice(price: number, symbol: string): string {
  const currency = inferTickerCurrency(symbol);
  const locale: Locale = currency === 'VND' ? 'vi-VN' : 'en-US';
  const minorUnits = Math.round(price * (currency === 'VND' ? 1 : 100));
  return format({ amount: minorUnits, currency }, locale);
}

function formatPercent(dp: number): string {
  const sign = dp > 0 ? '+' : '';
  return `${sign}${dp.toFixed(2)}%`;
}

const ERROR_LABEL: Record<QuoteErrorCode, string> = {
  'no-key': 'No key',
  'invalid-key': 'Invalid key',
  'rate-limited': 'Rate limited',
  network: 'Network error',
  unknown: 'Quote unavailable',
};

interface PriceRowProps {
  state: QuoteState;
  refresh: () => void;
  symbol: string;
}

function PriceRow({ state, refresh, symbol }: PriceRowProps) {
  if (state.status === 'idle') return null;

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--cds-spacing-03)',
    minHeight: '1.5rem',
  } as const;

  if (state.status === 'loading') {
    return (
      <div style={rowStyle}>
        <SkeletonText width="80px" />
        <SkeletonText width="60px" />
      </div>
    );
  }

  if (state.status === 'error') {
    return (
      <div style={rowStyle}>
        <Tag size="sm" type="warm-gray" renderIcon={Information}>
          {ERROR_LABEL[state.error]}
        </Tag>
        <Button
          kind="ghost"
          size="sm"
          hasIconOnly
          iconDescription="Refresh price"
          renderIcon={Renew}
          onClick={refresh}
        />
      </div>
    );
  }

  if (state.quote === null) {
    return (
      <div style={rowStyle}>
        <span
          className="cds--type-body-02"
          style={{ color: 'var(--cds-text-helper)' }}
        >
          —
        </span>
        <span
          className="cds--type-helper-text-01"
          style={{ color: 'var(--cds-text-helper)' }}
        >
          No live price
        </span>
      </div>
    );
  }

  const { currentPrice, percentChange } = state.quote;
  const tagType: 'green' | 'red' | 'gray' =
    percentChange > 0 ? 'green' : percentChange < 0 ? 'red' : 'gray';
  const ArrowIcon = percentChange >= 0 ? ArrowUp : ArrowDown;

  return (
    <div style={rowStyle}>
      <span
        className="cds--type-body-02"
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {formatNativePrice(currentPrice, symbol)}
      </span>
      <Tag size="sm" type={tagType} renderIcon={ArrowIcon}>
        {formatPercent(percentChange)}
      </Tag>
      <Button
        kind="ghost"
        size="sm"
        hasIconOnly
        iconDescription="Refresh price"
        renderIcon={Renew}
        onClick={refresh}
      />
    </div>
  );
}

export default function TickerInputTile({
  index,
  selection,
  finnhubKey,
  onCommit,
}: Props) {
  const search = useTickerSearch(finnhubKey);
  const [items, setItems] = useState<TickerSearchResult[]>([]);
  const inputValueRef = useRef<string>(
    selection ? itemToString({ ...selection, type: '' }) : '',
  );

  const committedSymbol = selection?.symbol ?? null;
  const { state: quoteState, refresh: refreshQuote } = useTickerQuote(
    committedSymbol,
    finnhubKey,
  );

  // Synthesized once at mount; parent re-keys the tile on commit so external
  // selection changes are picked up by remount, not by controlled-prop sync
  // (which provokes Downshift to fire onChange during reconciliation).
  const initialSelectedItem = useMemo<TickerSearchResult | null>(
    () =>
      selection
        ? {
            symbol: selection.symbol,
            description: selection.description,
            exchange: selection.exchange,
            type: '',
          }
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const handleInputChange = useDebouncedCallback(async (input: string) => {
    inputValueRef.current = input;
    if (!input || input.trim().length < 1) {
      setItems([]);
      return;
    }
    try {
      const results = await search(input.trim());
      setItems(results);
    } catch {
      setItems([]);
    }
  }, 300);

  // Defer parent state updates so they don't fire during Downshift's render
  // phase (Downshift dispatches onChange synchronously from its reducer when
  // allowCustomValue commits on blur).
  function deferCommit(next: TickerSelection | null): void {
    queueMicrotask(() => onCommit(next));
  }

  function commitFreeText(raw: string): void {
    // Strip itemToString formatting if Downshift synced the input to "SYM  ·  Desc".
    const symbolPart = raw.split('  ·  ')[0] ?? '';
    const next = symbolPart.trim().toUpperCase();
    if (!next) {
      if (selection) deferCommit(null);
      return;
    }
    if (next === selection?.symbol && selection.description === '') return;
    deferCommit({
      symbol: next,
      description: '',
      exchange: null,
      pickedAt: nowIso(),
    });
  }

  function handleChange({
    selectedItem: picked,
    inputValue,
  }: {
    selectedItem?: TickerSearchResult | null;
    inputValue?: string | null;
  }): void {
    if (picked && picked.symbol) {
      inputValueRef.current = itemToString(picked);
      deferCommit({
        symbol: picked.symbol,
        description: picked.description,
        exchange: picked.exchange,
        pickedAt: nowIso(),
      });
      return;
    }
    if (typeof inputValue === 'string') commitFreeText(inputValue);
  }

  function handleBlur(e: FocusEvent<HTMLDivElement>): void {
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    const input = inputValueRef.current;
    if (input === itemToString(initialSelectedItem)) return;
    commitFreeText(input);
  }

  const slotNumber = index + 1;
  const helperText =
    finnhubKey === null
      ? 'Add a Finnhub key in Settings to enable search.'
      : undefined;

  return (
    <div
      onBlur={handleBlur}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--cds-spacing-03)',
      }}
    >
      <ComboBox
        id={`ticker-slot-${slotNumber}`}
        titleText={`Ticker ${slotNumber}`}
        placeholder={selection ? undefined : 'Search symbol or name'}
        items={items}
        itemToString={itemToString}
        onInputChange={handleInputChange}
        onChange={handleChange}
        initialSelectedItem={initialSelectedItem ?? undefined}
        helperText={helperText}
        allowCustomValue
      />
      {committedSymbol !== null && (
        <PriceRow
          state={quoteState}
          refresh={refreshQuote}
          symbol={committedSymbol}
        />
      )}
    </div>
  );
}
