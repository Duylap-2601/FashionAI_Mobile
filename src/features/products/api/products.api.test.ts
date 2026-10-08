import MockAdapter from 'axios-mock-adapter';
import { api } from '@/api/client';
import { ENDPOINTS } from '@/constants/endpoints';
import { ApiError } from '@/types/api';
import { getProduct, getProducts, mainProductImage } from './products.api';

const RAW_PRODUCT = {
  id: 'p1',
  name: 'Áo Sơ Mi Tay Ngắn',
  description: null,
  category: 'UPPER',
  garmentType: null,
  color: 'Trắng',
  colors: null,
  material: 'Cotton',
  price: '550000',
  originalPrice: null,
  stock: 10,
  brand: 'StAle. SIGNATURE',
  garmentUrl: 'https://cdn.example/ao.jpg',
  status: 'ACTIVE',
  avgRating: '4.5',
  reviewCount: 3,
  images: [
    {
      id: 'img1',
      productId: 'p1',
      imageUrl: 'https://cdn.example/ao.jpg',
      isMain: true,
      createdAt: '2026-10-01T00:00:00.000Z',
    },
  ],
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
};

describe('products API', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
  });

  it('normalizes transport failures through the shared HTTP boundary', async () => {
    mock.onGet(ENDPOINTS.PRODUCTS.LIST).networkError();

    const error = await getProducts().catch((value: unknown) => value);

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ code: 'NETWORK_ERROR', statusCode: 0 });
  });

  it('sends search/category/page/limit and maps products to numbers', async () => {
    mock.onGet(ENDPOINTS.PRODUCTS.LIST).reply((config) => {
      expect(config.params).toMatchObject({
        search: 'áo',
        category: 'UPPER',
        page: 1,
        limit: 10,
      });
      return [
        200,
        {
          success: true,
          code: 'OK',
          message: 'Thành công',
          data: [RAW_PRODUCT],
          meta: { page: 1, limit: 10, total: 1, totalPages: 1 },
        },
      ];
    });

    const result = await getProducts({ search: 'áo', category: 'UPPER', page: 1, limit: 10 });

    expect(result.data).toHaveLength(1);
    expect(result.data[0].price).toBe(550000);
    expect(result.data[0].brand).toBe('StAle. SIGNATURE');
    expect(result.meta).toMatchObject({ total: 1, totalPages: 1 });
  });

  it('fetches and maps a single product detail', async () => {
    mock.onGet(ENDPOINTS.PRODUCTS.DETAIL('p1')).reply(200, {
      success: true,
      code: 'OK',
      message: 'Thành công',
      data: RAW_PRODUCT,
    });

    const product = await getProduct('p1');

    expect(product.id).toBe('p1');
    expect(product.price).toBe(550000);
  });

  it('mainProductImage prefers the main image', () => {
    expect(mainProductImage(RAW_PRODUCT as any)).toBe('https://cdn.example/ao.jpg');
    expect(mainProductImage({ images: [] })).toBeUndefined();
  });
});
