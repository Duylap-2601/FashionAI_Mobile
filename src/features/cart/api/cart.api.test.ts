import MockAdapter from 'axios-mock-adapter';
import { api } from '@/api/client';
import { ENDPOINTS } from '@/constants/endpoints';
import { cartApi, isUuidV4, type ServerCart } from './cart.api';

const envelope = <T>(data: T) => ({
  success: true,
  code: 'OK',
  message: 'Thành công',
  data,
});

const PRODUCT_ID = '3f0c3f1e-8a1b-4c4d-9e6f-7a2b1c0d9e8f';
const LINE_ID = '9b1d4b6a-2f3e-4a5b-8c7d-1e2f3a4b5c6d';

const cartFixture: ServerCart = {
  items: [
    {
      id: LINE_ID,
      productId: PRODUCT_ID,
      color: 'Black',
      comboType: null,
      quantity: 2,
      available: true,
      product: {
        id: PRODUCT_ID,
        name: 'Áo sơ mi lụa',
        price: 500000,
        sale: null,
        status: 'ACTIVE',
        category: 'UPPER',
        garmentType: 'SHIRT',
        colors: [],
        imageUrl: 'https://cdn.example.com/shirt.png',
      },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ],
  totalItems: 2,
};

describe('cartApi', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
    jest.restoreAllMocks();
  });

  it('getCart fetches the server cart', async () => {
    mock.onGet(ENDPOINTS.CART.BASE).reply(200, envelope(cartFixture));

    const result = await cartApi.getCart();
    expect(result).toEqual(cartFixture);
  });

  it('addItem posts productId, quantity and color', async () => {
    const body = { productId: PRODUCT_ID, quantity: 1, color: 'Black' };
    mock.onPost(ENDPOINTS.CART.ITEMS, body).reply(200, envelope(cartFixture));

    const result = await cartApi.addItem(body);
    expect(result).toEqual(cartFixture);
  });

  it('updateItem patches the line quantity', async () => {
    mock.onPatch(ENDPOINTS.CART.ITEM(LINE_ID), { quantity: 3 }).reply(200, envelope(cartFixture));

    const result = await cartApi.updateItem(LINE_ID, 3);
    expect(result).toEqual(cartFixture);
  });

  it('removeItem deletes a single line', async () => {
    mock.onDelete(ENDPOINTS.CART.ITEM(LINE_ID)).reply(200, envelope(cartFixture));

    const result = await cartApi.removeItem(LINE_ID);
    expect(result).toEqual(cartFixture);
  });

  it('clearCart deletes the whole cart', async () => {
    mock.onDelete(ENDPOINTS.CART.BASE).reply(200, envelope({ items: [], totalItems: 0 }));

    const result = await cartApi.clearCart();
    expect(result).toEqual({ items: [], totalItems: 0 });
  });

  it('mergeCart posts guest lines and returns skipped lines', async () => {
    const lines = [{ productId: PRODUCT_ID, quantity: 2, color: 'Black' }];
    const merged = {
      ...cartFixture,
      skipped: [{ productId: PRODUCT_ID, color: 'Black', comboType: null, reason: 'INVALID_COLOR' }],
    };
    mock.onPost(ENDPOINTS.CART.MERGE, { items: lines }).reply(200, envelope(merged));

    const result = await cartApi.mergeCart(lines);
    expect(result).toEqual(merged);
  });
});

describe('isUuidV4', () => {
  it('accepts a uuid v4', () => {
    expect(isUuidV4(PRODUCT_ID)).toBe(true);
  });

  it('rejects slugs, uuid v1 and non-strings', () => {
    expect(isUuidV4('ao-so-mi-lua')).toBe(false);
    expect(isUuidV4('c2321a91-2fd0-11ee-be56-0242ac120002')).toBe(false);
    expect(isUuidV4(undefined)).toBe(false);
    expect(isUuidV4(42)).toBe(false);
  });
});
