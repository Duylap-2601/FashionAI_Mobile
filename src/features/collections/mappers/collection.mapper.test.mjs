import assert from 'node:assert/strict';
import test from 'node:test';

import { mapBackendCollection } from './collection.mapper.ts';

test('normalizes collection images without inventing fallbacks', () => {
  const collection = mapBackendCollection({
    id: '3dd74edd-7396-474a-8015-ba410d3a6c10',
    name: 'Dấu Ấn',
    slug: 'da',
    description: 'Thiết kế may đo hiện đại.',
    coverImages: [
      ' https://example.com/cover-1.jpg ',
      '',
      'https://example.com/cover-1.jpg',
      'https://example.com/cover-2.jpg',
    ],
    isPublished: true,
    displayOrder: 1,
    createdAt: '2026-09-08T09:04:13.795Z',
    updatedAt: '2026-09-10T09:17:40.113Z',
    _count: { products: 3 },
  });

  assert.deepEqual(collection.coverImages, [
    'https://example.com/cover-1.jpg',
    'https://example.com/cover-2.jpg',
  ]);
  assert.equal(collection.productCount, 3);
});

test('uses zero products when the optional backend count is absent', () => {
  const collection = mapBackendCollection({
    id: '41cfa1a3-7178-44f4-b6fd-952e75f71d3a',
    name: 'Nữ Tính',
    slug: 'nt',
    description: null,
    coverImages: [],
    isPublished: true,
    displayOrder: 2,
    createdAt: '2026-09-08T09:04:18.234Z',
    updatedAt: '2026-09-10T08:09:32.829Z',
  });

  assert.deepEqual(collection.coverImages, []);
  assert.equal(collection.productCount, 0);
});
