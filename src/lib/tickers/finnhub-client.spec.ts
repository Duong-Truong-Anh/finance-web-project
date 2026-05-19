import { describe, expect, it, vi } from 'vitest';
import { searchTickers } from './finnhub-client';

function ok(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function fail(status: number): Response {
  return new Response('', { status });
}

describe('searchTickers', () => {
  it('returns no-key error when apiKey is empty', async () => {
    const fetchImpl = vi.fn();
    const res = await searchTickers('AAPL', '', fetchImpl);
    expect(res).toEqual({ ok: false, error: 'no-key' });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('returns empty results for an empty query without calling fetch', async () => {
    const fetchImpl = vi.fn();
    const res = await searchTickers('   ', 'key123', fetchImpl);
    expect(res).toEqual({ ok: true, results: [] });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('maps a successful response into TickerSearchResult shape', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      ok({
        count: 3,
        result: [
          { symbol: 'AAPL', description: 'Apple Inc.', displaySymbol: 'AAPL', type: 'Common Stock' },
          { symbol: 'APPF', description: 'AppFolio Inc.', displaySymbol: 'APPF', type: 'Common Stock' },
          { symbol: 'VNM.HM', description: 'Vinamilk', displaySymbol: 'VNM.HM', type: 'Common Stock' },
        ],
      }),
    );
    const res = await searchTickers('app', 'key123', fetchImpl);
    expect(res).toEqual({
      ok: true,
      results: [
        { symbol: 'AAPL', description: 'Apple Inc.', exchange: null, type: 'Common Stock' },
        { symbol: 'APPF', description: 'AppFolio Inc.', exchange: null, type: 'Common Stock' },
        { symbol: 'VNM.HM', description: 'Vinamilk', exchange: 'HM', type: 'Common Stock' },
      ],
    });
  });

  it('parses no exchange for a symbol without a dot', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      ok({
        count: 1,
        result: [{ symbol: 'AAPL', description: 'Apple Inc.', displaySymbol: 'AAPL', type: 'Common Stock' }],
      }),
    );
    const res = await searchTickers('aapl', 'key123', fetchImpl);
    expect(res.ok && res.results[0].exchange).toBeNull();
  });

  it('parses the suffix after the last dot as the exchange', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      ok({
        count: 1,
        result: [{ symbol: 'VNM.HM', description: 'Vinamilk', displaySymbol: 'VNM.HM', type: 'Common Stock' }],
      }),
    );
    const res = await searchTickers('vnm', 'key123', fetchImpl);
    expect(res.ok && res.results[0].exchange).toBe('HM');
  });

  it('returns network error when fetch rejects', async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error('boom'));
    const res = await searchTickers('aapl', 'key123', fetchImpl);
    expect(res).toEqual({ ok: false, error: 'network' });
  });

  it('returns rate-limited on HTTP 429', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(fail(429));
    const res = await searchTickers('aapl', 'key123', fetchImpl);
    expect(res).toEqual({ ok: false, error: 'rate-limited' });
  });

  it('returns invalid-key on HTTP 401', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(fail(401));
    const res = await searchTickers('aapl', 'badkey', fetchImpl);
    expect(res).toEqual({ ok: false, error: 'invalid-key' });
  });

  it('returns invalid-key on HTTP 403', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(fail(403));
    const res = await searchTickers('aapl', 'badkey', fetchImpl);
    expect(res).toEqual({ ok: false, error: 'invalid-key' });
  });

  it('returns network error on other non-OK statuses', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(fail(500));
    const res = await searchTickers('aapl', 'key123', fetchImpl);
    expect(res).toEqual({ ok: false, error: 'network' });
  });
});
