const windows = new Map<string, { count: number; reset: number }>();
export function rateLimit(key: string, max = 10, windowMs = 60_000) {
  const now = Date.now();
  const current = windows.get(key);
  if (!current || current.reset < now) {
    windows.set(key, { count: 1, reset: now + windowMs });
    return true;
  }
  if (current.count >= max) return false;
  current.count += 1;
  return true;
}
