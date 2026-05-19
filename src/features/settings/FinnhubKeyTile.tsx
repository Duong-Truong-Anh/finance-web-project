'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button, TextInput, Tile, ToastNotification } from '@carbon/react';
import type { SearchErrorCode, SearchResponse } from '@/src/lib/tickers';
import type { Settings } from '@/src/lib/settings';

interface Props {
  settings: Settings;
  onSet: (value: Settings) => Promise<void>;
}

type ToastKind = 'success' | 'error';

interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  subtitle: string;
}

const ERROR_SUBTITLES: Record<SearchErrorCode, string> = {
  'no-key': 'Add a Finnhub key above before testing the connection.',
  'invalid-key': 'Finnhub rejected this key. Check it and try again.',
  'rate-limited': 'Finnhub rate limit reached. Wait a minute and retry.',
  network: 'Could not reach Finnhub. Check your network and try again.',
  unknown: 'Something went wrong. Try again in a moment.',
};

const TOAST_TIMEOUT_MS = 4_000;

export function FinnhubKeyTile({ settings, onSet }: Props) {
  const [draft, setDraft] = useState(settings.finnhubKey ?? '');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [testing, setTesting] = useState(false);
  const nextIdRef = useRef(0);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  // Clear any outstanding timers on unmount.
  useEffect(
    () => () => {
      timersRef.current.forEach(clearTimeout);
      timersRef.current.clear();
    },
    [],
  );

  const pushToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = nextIdRef.current++;
    setToasts((current) => [...current, { ...toast, id }]);
    const timer = setTimeout(() => {
      timersRef.current.delete(id);
      setToasts((current) => current.filter((t) => t.id !== id));
    }, TOAST_TIMEOUT_MS);
    timersRef.current.set(id, timer);
  }, []);

  function handleBlur() {
    const trimmed = draft.trim();
    const next = trimmed.length > 0 ? trimmed : null;
    if (next !== settings.finnhubKey) {
      void onSet({ ...settings, finnhubKey: next });
    }
  }

  async function handleTest() {
    const apiKey = settings.finnhubKey ?? '';
    if (!apiKey) {
      pushToast({
        kind: 'error',
        title: 'Connection failed',
        subtitle: ERROR_SUBTITLES['no-key'],
      });
      return;
    }
    setTesting(true);
    try {
      const res = await fetch('/api/tickers/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'AAPL', apiKey }),
      });
      const data = (await res.json()) as SearchResponse;
      if (data.ok) {
        pushToast({
          kind: 'success',
          title: 'Connected',
          subtitle: 'Live ticker search is working.',
        });
      } else {
        pushToast({
          kind: 'error',
          title: 'Connection failed',
          subtitle: ERROR_SUBTITLES[data.error],
        });
      }
    } catch {
      pushToast({
        kind: 'error',
        title: 'Connection failed',
        subtitle: ERROR_SUBTITLES.network,
      });
    } finally {
      setTesting(false);
    }
  }

  return (
    <Tile style={{ border: '1px solid var(--cds-border-subtle-01)' }}>
      <p
        className="cds--type-productive-heading-01"
        style={{ marginBlockEnd: 'var(--cds-spacing-05)' }}
      >
        Finnhub API key
      </p>
      <TextInput
        id="finnhub-key"
        type="password"
        labelText="Finnhub key"
        helperText="Stored in your browser's LocalStorage. We never send it to our servers because we don't have any."
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={handleBlur}
        style={{ marginBlockEnd: 'var(--cds-spacing-05)' }}
      />
      <Button kind="tertiary" size="sm" onClick={handleTest} disabled={testing}>
        Test connection
      </Button>
      {toasts.length > 0 && (
        <div
          style={{
            position: 'fixed',
            insetBlockEnd: 'var(--cds-spacing-05)',
            insetInlineEnd: 'var(--cds-spacing-05)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--cds-spacing-03)',
            zIndex: 9000,
          }}
          role="status"
          aria-live="polite"
        >
          {toasts.map((t) => (
            <ToastNotification
              key={t.id}
              kind={t.kind}
              title={t.title}
              subtitle={t.subtitle}
              onClose={() => {
                dismiss(t.id);
                return true;
              }}
            />
          ))}
        </div>
      )}
    </Tile>
  );
}
