import type { IProduct } from '../types/product';

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

type ProductImageOptions = {
  width?: number;
  quality?: number;
};

const CLOUDINARY_HOST_RE = /^https?:\/\/[^/]*cloudinary\.com\//;

export function optimizeCloudinaryImageUrl(
  imageUrl: string,
  { width = 800, quality = 75 }: ProductImageOptions = {},
): string {
  const url = imageUrl.trim();
  if (!url || !CLOUDINARY_HOST_RE.test(url)) {
    return url;
  }

  const uploadSegment = '/upload/';
  const uploadIndex = url.indexOf(uploadSegment);
  if (uploadIndex === -1) {
    return url;
  }

  const base = url.slice(0, uploadIndex + uploadSegment.length);
  const rest = url.slice(uploadIndex + uploadSegment.length);
  const transform = `w_${width},q_${quality},f_auto/`;

  if (rest.startsWith(transform)) {
    return url;
  }

  return `${base}${transform}${rest}`;
}

function sortImagesMainFirst(images: IProduct['images']): IProduct['images'] {
  return [...images].sort(
    (left, right) => Number(right.isMain) - Number(left.isMain),
  );
}

export function getProductImageUrls(
  product: IProduct,
  options?: ProductImageOptions,
): string[] {
  const orderedImages = sortImagesMainFirst(product.images);
  const seenUrls = new Set<string>();

  return orderedImages.flatMap((image) => {
    const imageUrl = image.imageUrl.trim();
    if (!imageUrl || seenUrls.has(imageUrl)) {
      return [];
    }

    seenUrls.add(imageUrl);
    return [optimizeCloudinaryImageUrl(imageUrl, options)];
  });
}

export function getProductMainImage(
  product: IProduct,
  options?: ProductImageOptions,
): string | null {
  return getProductImageUrls(product, options)[0] ?? null;
}

export function normalizeColorName(color?: string | null): string {
  return color?.trim().toLowerCase().replace(/^màu\s+/u, '') ?? '';
}

/**
 * Ảnh cho một màu: ảnh gắn đúng màu, nếu không có thì ảnh không gắn màu, rồi tới ảnh chính.
 */
export function resolveProductImageForColor(
  product: IProduct,
  selectedColor?: string | null,
  options?: ProductImageOptions,
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
      return {
        url: optimizeCloudinaryImageUrl(colorImage.imageUrl, options),
        matchedColor: true,
      };
    }

    const hasTaggedImages = images.some((image) =>
      Boolean(image.colorName?.trim()),
    );
    if (!hasTaggedImages && (product.colors?.length ?? 0) > 1) {
      const colorIndex =
        product.colors?.findIndex(
          (color) => normalizeColorName(color.name) === normalizedColor,
        ) ?? -1;
      const untaggedImages = product.images.filter((image) =>
        Boolean(image.imageUrl.trim()),
      );
      const fallbackImage =
        colorIndex >= 0 ? untaggedImages[colorIndex] : undefined;
      if (fallbackImage) {
        return {
          url: optimizeCloudinaryImageUrl(fallbackImage.imageUrl, options),
          matchedColor: false,
        };
      }
    }
  }

  const genericImage = images.find((image) => !image.colorName?.trim());
  const mainImage = images.find((image) => image.isMain);
  const fallbackImage = genericImage ?? mainImage ?? images[0];

  return {
    url: fallbackImage
      ? optimizeCloudinaryImageUrl(fallbackImage.imageUrl, options)
      : null,
    matchedColor: false,
  };
}

export function formatProductPrice(price: number): string {
  return currencyFormatter.format(price);
}
