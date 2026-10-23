import MockAdapter from 'axios-mock-adapter';
import { api } from '@/api/client';
import { shippingApi } from './shipping.api';
import { ENDPOINTS } from '@/constants/endpoints';

const envelope = <T>(data: T, meta?: any) => ({
  success: true,
  code: 'OK',
  message: 'Thành công',
  data,
  meta,
});

describe('shippingApi', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
    jest.restoreAllMocks();
  });

  it('getCapabilities fetches shipping capabilities', async () => {
    const capabilities = {
      capabilityVersion: 'ghn-address-2026-01',
      policyVersion: 'FASHION_SINGLE_PARCEL_V1',
      serverTime: '2026-01-01T00:00:00.000Z',
      catalogRevision: '12',
      catalogEnabled: true,
      newAddressWriteEnabled: true,
      newAddressCheckoutEnabled: true,
      upgradeRequired: false,
    };
    mock.onGet(ENDPOINTS.SHIPPING.CAPABILITIES).reply(200, envelope(capabilities));

    const result = await shippingApi.getCapabilities();
    expect(result).toEqual(capabilities);
  });

  it('getAddressCatalogProvinces fetches provinces by revision', async () => {
    const provinces = [
      { id: '1000001', name: 'Hà Nội', aliases: ['Ha Noi'], catalogRevision: '12' },
    ];
    mock
      .onGet(ENDPOINTS.SHIPPING.ADDRESS_CATALOG_PROVINCES, {
        params: { revision: '12' },
      })
      .reply(200, envelope(provinces));

    const result = await shippingApi.getAddressCatalogProvinces('12');
    expect(result).toEqual(provinces);
  });

  it('getAddressCatalogWards fetches wards for a province', async () => {
    const wards = [
      { id: '1003575', name: 'Phường Bến Nghé', aliases: [], catalogRevision: '12' },
    ];
    mock
      .onGet(ENDPOINTS.SHIPPING.ADDRESS_CATALOG_WARDS, {
        params: { provinceId: '1000001', revision: '12' },
      })
      .reply(200, envelope(wards));

    const result = await shippingApi.getAddressCatalogWards('1000001', '12');
    expect(result).toEqual(wards);
  });
});
