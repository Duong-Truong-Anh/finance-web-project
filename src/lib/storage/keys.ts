export const STORAGE_NAMESPACE = 'flowstate:v1:' as const;

export const STORAGE_KEYS = {
  transactions: `${STORAGE_NAMESPACE}transactions`,
  portfolio: `${STORAGE_NAMESPACE}portfolio`,
  settings: `${STORAGE_NAMESPACE}settings`,
  fx: `${STORAGE_NAMESPACE}fx`,
  meta: `${STORAGE_NAMESPACE}meta`,
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
