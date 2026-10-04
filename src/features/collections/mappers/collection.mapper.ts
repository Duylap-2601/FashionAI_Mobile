import type { BackendCollection, Collection } from '../types/collection';

export function mapBackendCollection(raw: BackendCollection): Collection {
  const seenImages = new Set<string>();
  const coverImages = raw.coverImages.flatMap((imageUrl) => {
    const normalizedUrl = imageUrl.trim();
    if (!normalizedUrl || seenImages.has(normalizedUrl)) {
      return [];
    }

    seenImages.add(normalizedUrl);
    return [normalizedUrl];
  });

  return {
    id: raw.id,
    name: raw.name,
    slug: raw.slug,
    description: raw.description,
    coverImages,
    isPublished: raw.isPublished,
    displayOrder: raw.displayOrder,
    productCount: raw._count?.products ?? 0,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

