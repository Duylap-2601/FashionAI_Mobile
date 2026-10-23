import MockAdapter from 'axios-mock-adapter';
import { api } from '@/api/client';
import { http } from '@/api/http';
import { ENDPOINTS } from '@/constants/endpoints';
import {
  analyzeStylist,
  buildStylistFormData,
  deleteStylistHistoryItem,
  getStylistHistory,
  getStylistHistoryItem,
} from './stylist.api';
import type { IStylistImageFile } from '../types/stylist';

const envelope = <T>(data: T, meta?: Record<string, unknown>) => ({
  success: true,
  code: 'OK',
  message: 'Thành công',
  data,
  ...(meta ? { meta } : {}),
});

const backendResult = {
  id: 'result-1',
  humanImageUrl: 'https://cdn.example/human.jpg',
  product: { id: 'product-1', name: 'Blazer Navy', price: '1200000' },
  garmentDescription: 'Blazer navy may đo',
  occasion: 'Họp quan trọng',
  stylePreference: 'Tối giản',
  budget: 'Dưới 2 triệu',
  genderPreference: 'female',
  analysisResult: {
    bodyType: 'Dáng cân đối',
    skinTone: 'Tông lạnh',
    personalColor: 'Winter',
    fitRecommendation: 'Phom ôm nhẹ',
    fitAdvice: 'Chừa độ cử động ở vai',
    productCompatibilityScore: 88,
    colorSuggestions: ['Navy', 'Trắng'],
    outfitCombinations: ['Blazer navy, sơ mi trắng và quần suông'],
    stylingTips: 'Giữ phụ kiện tối giản.',
    verdict: 'Phù hợp với dịp họp quan trọng.',
  },
  model: 'gemini-2.0-flash',
  createdAt: '2026-10-02T00:00:00.000Z',
  isCached: false,
};

describe('stylist API', () => {
  let mock: MockAdapter;

  beforeEach(() => {
    mock = new MockAdapter(api);
  });

  afterEach(() => {
    mock.restore();
    jest.restoreAllMocks();
  });

  it('uploads the exact multipart DTO with a 90 second timeout', async () => {
    const image = Object.assign(new Blob(['image'], { type: 'image/jpeg' }), {
      uri: 'file:///human.jpg',
      name: 'human.jpg',
    }) as unknown as IStylistImageFile;
    const signal = new AbortController().signal;
    const onProgress = jest.fn();
    const upload = jest.spyOn(http, 'upload').mockResolvedValue(backendResult);

    await expect(
      analyzeStylist(
        {
          humanImage: image,
          imageConsent: true,
          garmentDescription: ' Blazer navy may đo ',
          occasion: ' Họp quan trọng ',
          stylePreference: ' Tối giản ',
          budget: ' Dưới 2 triệu ',
          genderPreference: 'female',
        },
        { signal, onProgress },
      ),
    ).resolves.toMatchObject({
      id: 'result-1',
      analysis: { productCompatibilityScore: 88 },
    });

    expect(upload).toHaveBeenCalledWith(
      ENDPOINTS.STYLIST.ANALYZE,
      expect.any(FormData),
      { signal, timeout: 90000, onProgress },
    );
    const form = upload.mock.calls[0]?.[1];
    expect(form?.get('humanImage')).toBeTruthy();
    expect(form?.get('imageConsent')).toBe('true');
    expect(form?.get('garmentDescription')).toBe('Blazer navy may đo');
    expect(form?.get('occasion')).toBe('Họp quan trọng');
    expect(form?.get('stylePreference')).toBe('Tối giản');
    expect(form?.get('budget')).toBe('Dưới 2 triệu');
    expect(form?.get('genderPreference')).toBe('female');
  });

  it('builds a text-only request without an image', () => {
    const form = buildStylistFormData({
      garmentDescription: ' Blazer navy may đo ',
      occasion: ' Đi làm ',
    });

    expect(form.get('humanImage')).toBeNull();
    expect(form.get('imageConsent')).toBeNull();
    expect(form.get('garmentDescription')).toBe('Blazer navy may đo');
    expect(form.get('occasion')).toBe('Đi làm');
  });

  it('builds a product request with consent when an image is attached', () => {
    const image = Object.assign(new Blob(['image'], { type: 'image/jpeg' }), {
      uri: 'file:///human.jpg',
      name: 'human.jpg',
    }) as unknown as IStylistImageFile;
    const form = buildStylistFormData({
      humanImage: image,
      imageConsent: true,
      productId: ' product-1 ',
    });

    expect(form.get('humanImage')).toBeTruthy();
    expect(form.get('imageConsent')).toBe('true');
    expect(form.get('productId')).toBe('product-1');
  });

  it('requires image consent when a human image is uploaded', () => {
    const image = Object.assign(new Blob(['image'], { type: 'image/jpeg' }), {
      uri: 'file:///human.jpg',
      name: 'human.jpg',
    }) as unknown as IStylistImageFile;

    expect(() => buildStylistFormData({ humanImage: image })).toThrow(
      'Image consent is required when uploading a human image',
    );
  });

  it('requires at least one stylist input', () => {
    expect(() => buildStylistFormData({})).toThrow(
      'At least one stylist input is required',
    );
  });

  it('gets a paginated history and normalizes nested analysis results', async () => {
    const meta = { total: 21, page: 2, limit: 20, totalPages: 2 };
    mock.onGet(ENDPOINTS.STYLIST.HISTORY).reply((config) => {
      expect(config.params).toEqual({ page: 2, limit: 20 });
      return [200, envelope([backendResult], meta)];
    });

    await expect(getStylistHistory({ page: 2, limit: 20 })).resolves.toEqual({
      data: [
        expect.objectContaining({
          id: 'result-1',
          product: { id: 'product-1', name: 'Blazer Navy' },
          analysis: expect.objectContaining({ personalColor: 'Winter' }),
        }),
      ],
      meta,
    });
  });

  it('gets and deletes a history item by its result id', async () => {
    mock
      .onGet(ENDPOINTS.STYLIST.DETAIL('result-1'))
      .reply(200, envelope(backendResult));
    mock
      .onDelete(ENDPOINTS.STYLIST.DELETE('result-1'))
      .reply(200, envelope(null));

    await expect(getStylistHistoryItem(' result-1 ')).resolves.toMatchObject({
      id: 'result-1',
    });
    await expect(deleteStylistHistoryItem(' result-1 ')).resolves.toBeNull();
  });
});
