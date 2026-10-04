import MockAdapter from 'axios-mock-adapter';
import { api } from '@/api/client';
import { ENDPOINTS } from '@/constants/endpoints';
import {
  clearRack,
  getRackItems,
  pinProductToRack,
  removeRackItem,
} from './rack.api';

const envelope = <T>(data: T) => ({
  success: true,
  code: 'OK',
  message: 'Thành công',
  data,
});

const backendRackItem = {
  id: 'rack-item-1',
  userId: 'user-1',
  productId: 'product-1',
  createdAt: '2026-10-01T00:00:00.000Z',
  product: {
    id: 'product-1',
    name: 'Áo khoác dáng ngắn',
    description: null,
    category: 'UPPER' as const,
    garmentType: 'JACKET' as const,
    color: 'Đỏ',
    colors: [{ name: 'Đỏ', hex: '#7B1F35' }],
    material: 'Cotton',
    price: '550000',
    originalPrice: null,
    stock: 0,
    brand: 'FashionAI',
    garmentUrl: 'https://cdn.example/garment.png',
    status: 'ACTIVE' as const,
    avgRating: '4.5',
    reviewCount: 12,
    images: [
      {
        id: 'image-1',
        productId: 'product-1',
        imageUrl: 'https://cdn.example/product.jpg',
        isMain: true,
        createdAt: '2026-10-01T00:00:00.000Z',
      },
    ],
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
  },
};

describe('rack API', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
  });

  it('gets Rack items and maps the embedded backend Product', async () => {
    mock.onGet(ENDPOINTS.RACK.BASE).reply(200, envelope([backendRackItem]));

    await expect(getRackItems()).resolves.toEqual([
      expect.objectContaining({
        id: 'rack-item-1',
        productId: 'product-1',
        product: expect.objectContaining({ price: 550000, avgRating: 4.5 }),
      }),
    ]);
  });

  it('pins a product using only the productId contract', async () => {
    mock.onPost(ENDPOINTS.RACK.BASE).reply((config) => {
      expect(JSON.parse(config.data)).toEqual({ productId: 'product-1' });
      return [200, envelope(backendRackItem)];
    });

    await expect(pinProductToRack(' product-1 ')).resolves.toMatchObject({
      id: 'rack-item-1',
      productId: 'product-1',
    });
  });

  it('removes one item by Rack item id rather than product id', async () => {
    mock
      .onDelete(ENDPOINTS.RACK.ITEM('rack-item-1'))
      .reply(200, envelope({ id: 'rack-item-1' }));

    await expect(removeRackItem(' rack-item-1 ')).resolves.toEqual({
      id: 'rack-item-1',
    });
    expect(mock.history.delete).toHaveLength(1);
    expect(mock.history.delete[0]?.url).toBe('/rack/rack-item-1');
  });

  it('clears all items through the dedicated static endpoint', async () => {
    mock.onDelete(ENDPOINTS.RACK.ALL).reply(200, envelope({ deleted: 3 }));

    await expect(clearRack()).resolves.toEqual({ deleted: 3 });
  });
});
