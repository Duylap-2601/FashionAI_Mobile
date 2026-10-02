import type { IStylistHistoryParams } from '../types/stylist';

export function normalizeStylistHistoryParams(
  params: Omit<IStylistHistoryParams, 'page'> = {},
) {
  const limit = params.limit && params.limit > 0 ? Math.floor(params.limit) : 20;
  return { limit } as const;
}

export const stylistKeys = {
  all: ['stylist'] as const,
  histories: () => [...stylistKeys.all, 'history'] as const,
  history: (params: Omit<IStylistHistoryParams, 'page'> = {}) =>
    [...stylistKeys.histories(), normalizeStylistHistoryParams(params)] as const,
  details: () => [...stylistKeys.all, 'detail'] as const,
  detail: (resultId: string) => [...stylistKeys.details(), resultId] as const,
};
