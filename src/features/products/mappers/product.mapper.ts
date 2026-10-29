import {
  BackendProduct,
  BackendProductImage,
  IProduct,
  IProductColor,
  IProductImage,
} from '../types/product';

function toFiniteNumber(value: string | number, field: string): number {
  if (typeof value === 'string' && value.trim() === '') {
    throw new TypeError(`Product field "${field}" must be a finite number`);
  }

  const normalized = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(normalized)) {
    throw new TypeError(`Product field "${field}" must be a finite number`);
  }

  return normalized;
}

function mapProductImage(image: BackendProductImage): IProductImage {
  return {
    id: image.id,
    productId: image.productId,
    imageUrl: image.imageUrl,
    colorName: image.colorName ?? null,
    isMain: image.isMain,
    createdAt: image.createdAt,
  };
}

function mapProductColors(value: unknown): IProductColor[] | null {
  if (value === null || value === undefined) {
    return null;
  }

  if (!Array.isArray(value)) {
    throw new TypeError('Product field "colors" must be an array or null');
  }

  return value.map((color, index) => {
    if (!color || typeof color !== 'object') {
      throw new TypeError(`Product color at index ${index} must be an object`);
    }

    const record = color as Record<string, unknown>;
    if (typeof record.name !== 'string' || typeof record.hex !== 'string') {
      throw new TypeError(`Product color at index ${index} must include string name and hex values`);
    }

    return { name: record.name, hex: record.hex };
  });
}

export function mapBackendProduct(product: BackendProduct): IProduct {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    category: product.category,
    garmentType: product.garmentType,
    color: product.color,
    colors: mapProductColors(product.colors),
    material: product.material,
    price: toFiniteNumber(product.price, 'price'),
    originalPrice:
      product.originalPrice === null
        ? null
        : toFiniteNumber(product.originalPrice, 'originalPrice'),
    stock: product.stock,
    brand: product.brand,
    garmentUrl: product.garmentUrl,
    status: product.status,
    avgRating:
      product.avgRating === null ? 0 : toFiniteNumber(product.avgRating, 'avgRating'),
    reviewCount: product.reviewCount,
    images: product.images.map(mapProductImage),
    createdAt: product.createdAt,
    updatedAt: product.updatedAt,
  };
}
