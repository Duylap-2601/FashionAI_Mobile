import type { IProduct } from '../types/product';

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

export function getProductImageUrls(product: IProduct): string[] {
  const orderedImages = [...product.images].sort(
    (left, right) => Number(right.isMain) - Number(left.isMain),
  );
  const seenUrls = new Set<string>();

  return orderedImages.flatMap((image) => {
    const imageUrl = image.imageUrl.trim();
    if (!imageUrl || seenUrls.has(imageUrl)) {
      return [];
    }

    seenUrls.add(imageUrl);
    return [imageUrl];
  });
}

export function getProductMainImage(product: IProduct): string | null {
  return getProductImageUrls(product)[0] ?? null;
}

export function formatProductPrice(price: number): string {
  return currencyFormatter.format(price);
}
