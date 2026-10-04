import assert from 'node:assert/strict';
import test from 'node:test';

import { getProductImageUrls } from './product-display.ts';

function createProduct(images) {
  return {
    id: 'product-1',
    name: 'Blazer may đo',
    category: 'UPPER',
    price: 1_200_000,
    originalPrice: null,
    brand: null,
    garmentUrl: 'https://example.com/garment.png',
    status: 'ACTIVE',
    avgRating: 4.5,
    reviewCount: 12,
    images,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

test('orders the main image first and preserves the remaining API image order', () => {
  const product = createProduct([
    {
      id: 'secondary',
      productId: 'product-1',
      imageUrl: ' https://example.com/secondary.jpg ',
      isMain: false,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'main',
      productId: 'product-1',
      imageUrl: 'https://example.com/main.jpg',
      isMain: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'third',
      productId: 'product-1',
      imageUrl: 'https://example.com/third.jpg',
      isMain: false,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ]);

  assert.deepEqual(getProductImageUrls(product), [
    'https://example.com/main.jpg',
    'https://example.com/secondary.jpg',
    'https://example.com/third.jpg',
  ]);
});

test('drops blank and duplicate image URLs without inventing a fallback URL', () => {
  const product = createProduct([
    {
      id: 'blank',
      productId: 'product-1',
      imageUrl: '   ',
      isMain: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'first',
      productId: 'product-1',
      imageUrl: 'https://example.com/product.jpg',
      isMain: false,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 'duplicate',
      productId: 'product-1',
      imageUrl: 'https://example.com/product.jpg',
      isMain: false,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ]);

  assert.deepEqual(getProductImageUrls(product), [
    'https://example.com/product.jpg',
  ]);
  assert.deepEqual(getProductImageUrls(createProduct([])), []);
});
