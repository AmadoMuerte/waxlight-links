interface Entry<T> {
  expiresAt: number;
  value: Promise<T>;
}

export class TtlCache<T> {
  #entries = new Map<string, Entry<T>>();

  get(key: string, ttlMs: number, load: () => Promise<T>) {
    const current = this.#entries.get(key);
    if (current && current.expiresAt > Date.now()) return current.value;

    const value = load().catch((error: unknown) => {
      this.#entries.delete(key);
      throw error;
    });
    this.#entries.set(key, { expiresAt: Date.now() + ttlMs, value });
    return value;
  }
}
