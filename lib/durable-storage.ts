const DEFAULT_DURABLE_STORAGE_MESSAGE =
  "Persistent storage is unavailable. Your changes were not saved.";

export class DurableStorageError extends Error {
  readonly statusCode = 503;

  constructor(message = DEFAULT_DURABLE_STORAGE_MESSAGE) {
    super(message);
    this.name = "DurableStorageError";
  }
}

export function isDurableStorageError(error: unknown): error is DurableStorageError {
  return error instanceof DurableStorageError;
}

export function canUseUnsafeLocalPersistence() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ALLOW_UNSAFE_LOCAL_PERSISTENCE === "1"
  );
}

export function assertCanUseUnsafeLocalPersistence(message?: string) {
  if (!canUseUnsafeLocalPersistence()) {
    throw new DurableStorageError(message ?? DEFAULT_DURABLE_STORAGE_MESSAGE);
  }
}
