import { settingsSchema, type Settings, type Theme } from './schema';
import { createStorageAdapter } from '../storage/adapter';
import { STORAGE_KEYS } from '../storage/keys';

// Re-export for backward-compat: app/lib/cookies-server.ts and header switchers
// import `type { Theme }` from this path.
export type { Settings, Theme };

export const DEFAULT_SETTINGS: Settings = {
  displayCurrency: 'VND',
  theme: 'g90',
  finnhubKey: null,
  fxAutoRefresh: true,
  schemaVersion: 1,
};

export interface SettingsRepository {
  get(): Promise<Settings | null>;
  set(value: Settings): Promise<void>;
  clear(): Promise<void>;
}

// Cookie names match what cookies-server.ts reads for SSR.
const COOKIE_THEME = 'flowstate-theme';
const COOKIE_CURRENCY = 'flowstate-currency';
const COOKIE_OPTS = 'Path=/; Max-Age=31536000; SameSite=Lax';

function writeCookies(settings: Settings): void {
  // Guard: document is unavailable during SSR. Repository is only called from
  // client components, but the guard prevents crashes if ever called in a non-browser context.
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_THEME}=${settings.theme}; ${COOKIE_OPTS}`;
  document.cookie = `${COOKIE_CURRENCY}=${settings.displayCurrency}; ${COOKIE_OPTS}`;
}

function clearCookies(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_THEME}=; Path=/; Max-Age=0; SameSite=Lax`;
  document.cookie = `${COOKIE_CURRENCY}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function createLocalStorageSettingsRepository(opts?: {
  storage?: Storage;
}): SettingsRepository {
  const adapter = createStorageAdapter(opts?.storage ?? globalThis.localStorage);
  const KEY = STORAGE_KEYS.settings;

  return {
    async get(): Promise<Settings | null> {
      const raw = adapter.read<Settings | null>(KEY, null);
      if (raw === null) return null;
      const result = settingsSchema.safeParse(raw);
      return result.success ? result.data : null;
    },

    async set(value: Settings): Promise<void> {
      adapter.write(KEY, settingsSchema.parse(value));
      // Mirror theme + displayCurrency to cookies so Server Components see the
      // updated values on the next request without a client-side read.
      // finnhubKey, fxAutoRefresh, and schemaVersion are NOT mirrored (data model §1.3).
      writeCookies(value);
    },

    async clear(): Promise<void> {
      adapter.remove(KEY);
      clearCookies();
    },
  };
}

export const settingsRepository: SettingsRepository =
  createLocalStorageSettingsRepository();
