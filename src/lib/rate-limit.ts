interface Entry {
  count: number;
  windowStart: number;
}

export function createRateLimiter(maxRequests: number, windowMs: number) {
  const store = new Map<string, Entry>();

  return function check(ip: string): boolean {
    const now = Date.now();
    const entry = store.get(ip);

    if (!entry || now - entry.windowStart > windowMs) {
      store.set(ip, { count: 1, windowStart: now });
      return true;
    }

    if (entry.count >= maxRequests) {
      return false;
    }

    entry.count++;
    return true;
  };
}
