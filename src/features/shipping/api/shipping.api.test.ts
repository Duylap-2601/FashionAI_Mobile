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

  it('getProvinces fetches provinces list', async () => {
    const provinces = [{ id: 1, name: 'Hà Nội' }, { id: 2, name: 'TP. Hồ Chí Minh' }];
    mock.onGet(ENDPOINTS.SHIPPING.PROVINCES).reply(200, envelope(provinces));

    const result = await shippingApi.getProvinces();
    expect(result).toEqual(provinces);
  });

  it('getDistricts fetches districts for a province', async () => {
    const districts = [{ id: 10, name: 'Quận 1' }];
    mock.onGet(ENDPOINTS.SHIPPING.DISTRICTS, { params: { provinceId: 2 } }).reply(200, envelope(districts));

    const result = await shippingApi.getDistricts(2);
    expect(result).toEqual(districts);
  });

  it('getWards fetches wards for a district', async () => {
    const wards = [{ code: 'W1', name: 'Phường Bến Nghé' }];
    mock.onGet(ENDPOINTS.SHIPPING.WARDS, { params: { districtId: 10 } }).reply(200, envelope(wards));

    const result = await shippingApi.getWards(10);
    expect(result).toEqual(wards);
  });

  it('calculateFee posts payload and returns calculated fee', async () => {
    mock.onPost(ENDPOINTS.SHIPPING.CALCULATE_FEE).reply(200, envelope({ fee: 35000 }));

    const result = await shippingApi.calculateFee({ toDistrictId: 10 });
    expect(result).toEqual({ fee: 35000 });
  });
});
