'use client';

/**
 * TanStack Router nuqs adapter with correct serialization for array search values.
 *
 * Upstream `nuqs/adapters/tanstack-router` does `value.map((v) => [key, v])` for arrays.
 * TanStack Router parses JSON search (e.g. `sort=[{...}]`) into arrays of objects.
 * 1) Array elements must become strings for `URLSearchParams` (no `[object Object]`).
 * 2) Keys like `sort` / `filters` must be a *single* JSON array string so `param.get()`
 *    matches what `getSortingStateParser` / `getFiltersStateParser` expect from `serialize`.
 *
 * @see https://github.com/47ng/nuqs/issues (upstream fix when available)
 */
import { startTransition, useCallback, useMemo } from 'react';
import { useLocation, useRouter } from '@tanstack/react-router';
import {
  unstable_createAdapterProvider as createAdapterProvider,
  renderQueryString,
} from 'nuqs/adapters/custom';

function searchValueToParamPairs(
  key: string,
  value: unknown
): Array<[string, string]> {
  if (value === undefined || value === null) return [];

  if (Array.isArray(value)) {
    if (value.length === 0) return [];
    // Keys like `sort` / `filters`: nuqs serializes the whole array as one JSON string.
    // Emit a single param so `.get(key)` matches `createParser` + `JSON.parse` expectations.
    if (value.some((item) => item !== null && typeof item === 'object')) {
      return [[key, JSON.stringify(value)]];
    }
    return value.map((item) => [key, String(item)]);
  }

  if (typeof value === 'object') {
    return [[key, JSON.stringify(value)]];
  }

  return [[key, String(value)]];
}

function useNuqsTanstackRouterAdapter(watchKeys: Array<string>) {
  const pathname = useLocation({ select: (state) => state.pathname });
  const search = useLocation({
    select: (state) =>
      Object.fromEntries(
        Object.entries(state.search as Record<string, unknown>).filter(
          ([key]) => watchKeys.includes(key)
        )
      ),
  });
  const { navigate } = useRouter();

  return {
    searchParams: useMemo(
      () =>
        new URLSearchParams(
          Object.entries(search).flatMap(([key, value]) =>
            searchValueToParamPairs(key, value)
          )
        ),
      [search, watchKeys.join(',')]
    ),
    updateUrl: useCallback(
      (
        nextSearch: URLSearchParams,
        options: { history?: string; scroll?: boolean }
      ) => {
        startTransition(() => {
          navigate({
            from: '/',
            to: pathname + renderQueryString(nextSearch),
            replace: options.history === 'replace',
            resetScroll: options.scroll,
            hash: (prevHash) => prevHash ?? '',
            state: (state) => state,
          });
        });
      },
      [navigate, pathname]
    ),
    rateLimitFactor: 1,
  };
}

export const NuqsAdapter = createAdapterProvider(useNuqsTanstackRouterAdapter);
