export const collectionKeys = {
  all: ['collections'] as const,
  publishedLists: () => [...collectionKeys.all, 'published', 'list'] as const,
  publishedList: (limit: number) =>
    [...collectionKeys.publishedLists(), { limit }] as const,
  details: () => [...collectionKeys.all, 'detail'] as const,
  detail: (slug: string) => [...collectionKeys.details(), slug] as const,
  products: () => [...collectionKeys.all, 'products'] as const,
  productList: (collectionId: string, limit: number) =>
    [...collectionKeys.products(), collectionId, { limit }] as const,
};

