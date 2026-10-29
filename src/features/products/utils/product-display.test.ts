import type { IProduct, IProductImage } from '../types/product';
import {
  normalizeColorName,
  resolveProductImageForColor,
} from './product-display';

function buildImage(
  id: string,
  imageUrl: string,
  colorName: string | null,
  isMain = false,
): IProductImage {
  return {
    id,
    productId: 'product-1',
    imageUrl,
    colorName,
    isMain,
    createdAt: '2026-10-01T00:00:00.000Z',
  };
}

function buildProduct(images: IProductImage[]): IProduct {
  return { images } as IProduct;
}

describe('product image color resolution', () => {
  it('normalizes color names before matching', () => {
    expect(normalizeColorName('  Vàng Nhạt ')).toBe('vàng nhạt');
    expect(normalizeColorName(null)).toBe('');
  });

  it('returns the image bound to the selected color', () => {
    const product = buildProduct([
      buildImage('main', 'https://cdn.example/main.jpg', null, true),
      buildImage('be', 'https://cdn.example/be.jpg', 'Be'),
      buildImage('den', 'https://cdn.example/den.jpg', 'Đen'),
    ]);

    expect(resolveProductImageForColor(product, ' đen ')).toEqual({
      url: 'https://cdn.example/den.jpg',
      matchedColor: true,
    });
  });

  it('falls back to an image without a color, then the main image', () => {
    const withGeneric = buildProduct([
      buildImage('main', 'https://cdn.example/main.jpg', null, true),
      buildImage('den', 'https://cdn.example/den.jpg', 'Đen'),
    ]);
    expect(resolveProductImageForColor(withGeneric, 'Đỏ')).toEqual({
      url: 'https://cdn.example/main.jpg',
      matchedColor: false,
    });

    const withoutGeneric = buildProduct([
      buildImage('den', 'https://cdn.example/den.jpg', 'Đen', true),
      buildImage('be', 'https://cdn.example/be.jpg', 'Be'),
    ]);
    expect(resolveProductImageForColor(withoutGeneric, 'Đỏ')).toEqual({
      url: 'https://cdn.example/den.jpg',
      matchedColor: false,
    });
  });

  it('returns null when the product has no usable images', () => {
    expect(resolveProductImageForColor(buildProduct([]), 'Đen')).toEqual({
      url: null,
      matchedColor: false,
    });
  });
});
