import type {
  IProduct,
  IProductColor,
  IProductImage,
} from '../types/product';
import {
  getProductImageUrls,
  normalizeColorName,
  optimizeCloudinaryImageUrl,
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

function buildProduct(
  images: IProductImage[],
  colors: IProductColor[] | null = null,
): IProduct {
  return { images, colors } as IProduct;
}

describe('product image color resolution', () => {
  it('normalizes color names before matching', () => {
    expect(normalizeColorName('  Vàng Nhạt ')).toBe('vàng nhạt');
    expect(normalizeColorName(' Màu Đen ')).toBe('đen');
    expect(normalizeColorName(null)).toBe('');
  });

  it('falls back to image order when color images are not tagged', () => {
    const product = buildProduct(
      [
        buildImage('black', 'https://cdn.example/black.jpg', null),
        buildImage('yellow', 'https://cdn.example/yellow.jpg', null),
        buildImage('main', 'https://cdn.example/main.jpg', null, true),
      ],
      [
        { name: 'màu đen', hex: '#000000' },
        { name: 'màu vàng nhạt', hex: '#fffb94' },
      ],
    );

    expect(resolveProductImageForColor(product, 'màu đen')).toEqual({
      url: 'https://cdn.example/black.jpg',
      matchedColor: false,
    });
    expect(resolveProductImageForColor(product, 'màu vàng nhạt')).toEqual({
      url: 'https://cdn.example/yellow.jpg',
      matchedColor: false,
    });
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

  it('optimizes the selected color image URL', () => {
    const product = buildProduct([
      buildImage(
        'den',
        'https://res.cloudinary.com/demo/image/upload/v123/product.png',
        'Đen',
        true,
      ),
    ]);

    expect(resolveProductImageForColor(product, 'Đen')).toEqual({
      url: 'https://res.cloudinary.com/demo/image/upload/w_800,q_75,f_auto/v123/product.png',
      matchedColor: true,
    });
  });
});

describe('optimizeCloudinaryImageUrl', () => {
  it('injects width, quality and auto format into Cloudinary URLs', () => {
    expect(
      optimizeCloudinaryImageUrl(
        'https://res.cloudinary.com/demo/image/upload/v123/product.png',
      ),
    ).toBe(
      'https://res.cloudinary.com/demo/image/upload/w_800,q_75,f_auto/v123/product.png',
    );

    expect(
      optimizeCloudinaryImageUrl(
        'https://res.cloudinary.com/demo/image/upload/v123/product.png',
        { width: 1200, quality: 80 },
      ),
    ).toBe(
      'https://res.cloudinary.com/demo/image/upload/w_1200,q_80,f_auto/v123/product.png',
    );
  });

  it('leaves non-Cloudinary and already-optimized URLs untouched', () => {
    expect(optimizeCloudinaryImageUrl('https://cdn.example/product.png')).toBe(
      'https://cdn.example/product.png',
    );
    expect(
      optimizeCloudinaryImageUrl(
        'https://res.cloudinary.com/demo/image/upload/w_800,q_75,f_auto/v123/product.png',
      ),
    ).toBe(
      'https://res.cloudinary.com/demo/image/upload/w_800,q_75,f_auto/v123/product.png',
    );
  });

  it('optimizes product image URLs used by cards and galleries', () => {
    const product = buildProduct([
      buildImage(
        'main',
        'https://res.cloudinary.com/demo/image/upload/v123/main.png',
        null,
        true,
      ),
    ]);

    expect(getProductImageUrls(product, { width: 400 })).toEqual([
      'https://res.cloudinary.com/demo/image/upload/w_400,q_75,f_auto/v123/main.png',
    ]);
  });
});
