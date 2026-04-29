export class StorageQuotaExceededError extends Error {
  constructor(key: string, cause?: unknown) {
    super(`Browser storage quota exceeded while writing key: ${key}`);
    this.name = 'StorageQuotaExceededError';
    if (cause !== undefined) {
      this.cause = cause;
    }
  }
}
