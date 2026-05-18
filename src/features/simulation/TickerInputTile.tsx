'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { FocusEvent } from 'react';
import { ComboBox } from '@carbon/react';
import type { TickerSearchResult } from '@/src/lib/tickers';
import type { TickerSelection } from '@/src/lib/portfolio';
import { useTickerSearch } from './useTickerSearch';

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

export default function TickerInputTile({
  index,
  selection,
  finnhubKey,
  onCommit,
}: Props) {
  const search = useTickerSearch(finnhubKey);
  const [items, setItems] = useState<TickerSearchResult[]>([]);
  const inputValueRef = useRef<string>(selection?.symbol ?? '');

  const selectedItem = useMemo<TickerSearchResult | null>(
    () =>
      selection
        ? {
            symbol: selection.symbol,
            description: selection.description,
            exchange: selection.exchange,
            type: '',
          }
        : null,
    [selection],
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

  function commitFreeText(raw: string): void {
    // Strip itemToString formatting if Downshift synced the input to "SYM  ·  Desc".
    const symbolPart = raw.split('  ·  ')[0] ?? '';
    const next = symbolPart.trim().toUpperCase();
    if (!next) {
      if (selection) onCommit(null);
      return;
    }
    if (next === selection?.symbol && selection.description === '') return;
    onCommit({
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
      onCommit({
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
    if (input === itemToString(selectedItem)) return;
    commitFreeText(input);
  }

  const slotNumber = index + 1;
  const helperText =
    finnhubKey === null
      ? 'Add a Finnhub key in Settings to enable search.'
      : undefined;

  return (
    <div onBlur={handleBlur}>
      <ComboBox
        id={`ticker-slot-${slotNumber}`}
        titleText={`Ticker ${slotNumber}`}
        placeholder={selection ? undefined : 'Search symbol or name'}
        items={items}
        itemToString={itemToString}
        onInputChange={handleInputChange}
        onChange={handleChange}
        selectedItem={selectedItem}
        helperText={helperText}
        allowCustomValue
      />
    </div>
  );
}
