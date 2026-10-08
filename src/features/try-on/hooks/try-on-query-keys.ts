export const tryOnQueryKeys = {
  history: (limit?: number) =>
    limit === undefined ? (['try-on-history'] as const) : (['try-on-history', limit] as const),
};
