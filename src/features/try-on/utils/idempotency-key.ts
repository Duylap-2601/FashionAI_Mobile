// Generates a client-side idempotency key for live session creation.
// Not cryptographically strong — this only needs to be unique per request,
// not unguessable, so Math.random is sufficient and avoids adding a crypto
// dependency just for this.
export function generateIdempotencyKey(): string {
  const globalCrypto = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (globalCrypto?.randomUUID) {
    return globalCrypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
