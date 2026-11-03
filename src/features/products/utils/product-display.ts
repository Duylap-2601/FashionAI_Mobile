import type { IProduct } from '../types/product';

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

function sortImagesMainFirst(images: IProduct['images']): IProduct['images'] {
  return [...images].sort(
    (left, right) => Number(right.isMain) - Number(left.isMain),
  );
}

export function getProductImageUrls(product: IProduct): string[] {
  const orderedImages = sortImagesMainFirst(product.images);
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

export function normalizeColorName(color?: string | null): string {
  return color?.trim().toLowerCase() ?? '';
}

/**
 * Ảnh cho một màu: ảnh gắn đúng màu, nếu không có thì ảnh không gắn màu, rồi tới ảnh chính.
 */
export function resolveProductImageForColor(
  product: IProduct,
  selectedColor?: string | null,
): { url: string | null; matchedColor: boolean } {
  const images = sortImagesMainFirst(product.images).filter(
    (image) => Boolean(image.imageUrl.trim()),
  );
  const normalizedColor = normalizeColorName(selectedColor);

  if (normalizedColor) {
    const colorImage = images.find(
      (image) => normalizeColorName(image.colorName) === normalizedColor,
    );
    if (colorImage) {
      return { url: colorImage.imageUrl.trim(), matchedColor: true };
    }
  }

  const genericImage = images.find((image) => !image.colorName?.trim());
  const mainImage = images.find((image) => image.isMain);
  const fallbackImage = genericImage ?? mainImage ?? images[0];

  return { url: fallbackImage?.imageUrl.trim() ?? null, matchedColor: false };
}

export function formatProductPrice(price: number): string {
  return currencyFormatter.format(price);
}
