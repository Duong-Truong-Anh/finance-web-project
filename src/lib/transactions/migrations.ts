// Schema migration runner. Call runMigrations() once on app load before any repository access.
// To add a schema change: increment CURRENT_VERSION, push a migration function to MIGRATIONS.

const STORAGE_KEY = 'flowstate:schema_version';
const CURRENT_VERSION = 1;

type Migration = () => void;

const MIGRATIONS: Migration[] = [
  // v0 → v1: establishes the initial schema baseline. No structural transform needed.
  () => { /* no-op */ },
];

export function runMigrations(): void {
  let stored: number;
  try {
    stored = parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10);
  } catch {
    // localStorage unavailable (SSR context or sandboxed iframe) — skip silently
    return;
  }

  if (stored >= CURRENT_VERSION) return;

  for (let i = stored; i < CURRENT_VERSION; i++) {
    MIGRATIONS[i]?.();
  }

  localStorage.setItem(STORAGE_KEY, String(CURRENT_VERSION));
}
