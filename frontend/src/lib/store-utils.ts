type RouteParams =
  | Record<string, string | string[]>
  | Readonly<Record<string, string | string[]>>
  | undefined;

export function getStoreIdentifier(params: RouteParams, fallback = ''): string {
  if (!params) return fallback;
  const record = params as Record<string, string | string[]>;
  const pick = (v: unknown): string => (Array.isArray(v) ? (v[0] ?? '') : (v as string)) || '';
  return pick(record.storeId) || pick(record.subdomain) || fallback;
}

export function getStoreBasePath(
  params: RouteParams,
  storeId?: string,
  fallback?: string
): string {
  const resolvedId = storeId || getStoreIdentifier(params, fallback || '');
  if (!resolvedId) return '';
  const record = (params || {}) as Record<string, string | string[]>;
  const usingStoreId = typeof record.storeId !== 'undefined';
  return `${usingStoreId ? '/stores' : '/store'}/${resolvedId}`;
}

