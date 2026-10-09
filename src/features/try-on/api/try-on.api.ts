import { Directory, File, Paths } from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import { http, HttpOptions } from '@/api/http';
import { ENDPOINTS } from '@/constants/endpoints';
import { ENV } from '@/config/env';
import { getTokens } from '@/features/auth/storage/secure-storage';
import { TryOnGenerateRequest, TryOnResult } from '@/features/try-on/types/try-on';

function appendFile(form: FormData, field: string, file: { uri: string; name: string; type: string }) {
  // RN's FormData accepts this file-descriptor shape directly; it is not a real Blob.
  form.append(field, file as unknown as Blob);
}

function buildGenerateFormData(payload: TryOnGenerateRequest): FormData {
  const form = new FormData();
  appendFile(form, 'humanImage', payload.humanImage);

  if (payload.garments?.length) {
    payload.garments.forEach((garment, index) => {
      form.append(`garments[${index}][category]`, garment.category);
      if (garment.productId) {
        form.append(`garments[${index}][productId]`, garment.productId);
      } else if (garment.garmentImage) {
        appendFile(form, `garments[${index}][image]`, garment.garmentImage);
      }
    });

    const primary = payload.garments[0];
    if (primary?.productId) form.append('productId', primary.productId);
    if (primary?.category) form.append('garmentCategory', primary.category);
    if (primary?.garmentImage) appendFile(form, 'garmentImage', primary.garmentImage);
  } else {
    if (payload.garmentImage) appendFile(form, 'garmentImage', payload.garmentImage);
    if (payload.productId) form.append('productId', payload.productId);
    if (payload.garmentCategory) form.append('garmentCategory', payload.garmentCategory);
  }

  return form;
}

export const tryOnApi = {
  generate(
    payload: TryOnGenerateRequest,
    opts?: HttpOptions & { onProgress?: (percent: number) => void },
  ): Promise<TryOnResult> {
    const { onProgress, ...rest } = opts ?? {};
    return http.upload<TryOnResult>(ENDPOINTS.TRY_ON.GENERATE, buildGenerateFormData(payload), {
      ...rest,
      timeout: rest.timeout ?? 180000,
      onProgress,
    });
  },

  getHistory(page: number, limit: number, opts?: HttpOptions): Promise<TryOnResult[]> {
    return http.get<TryOnResult[]>(ENDPOINTS.TRY_ON.HISTORY, {
      ...opts,
      params: { page, limit, ...opts?.params },
    });
  },

  getDetail(id: string, opts?: HttpOptions): Promise<TryOnResult> {
    return http.get<TryOnResult>(ENDPOINTS.TRY_ON.DETAIL(id), opts);
  },

  remove(id: string, opts?: HttpOptions): Promise<void> {
    return http.delete<void>(ENDPOINTS.TRY_ON.DELETE(id), opts);
  },

  removeAll(opts?: HttpOptions): Promise<void> {
    return http.delete<void>(ENDPOINTS.TRY_ON.DELETE_ALL, opts);
  },

  async downloadResult(id: string): Promise<string> {
    const { accessToken } = await getTokens();
    if (!accessToken) {
      throw new Error('Bạn cần đăng nhập để tải ảnh kết quả.');
    }

    const permission = await MediaLibrary.requestPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Cần quyền truy cập thư viện ảnh để lưu kết quả.');
    }

    const url = `${ENV.API_URL}${ENDPOINTS.TRY_ON.DOWNLOAD(id)}`;
    const destination = new File(new Directory(Paths.cache), `try-on-${id}.jpg`);

    const file = await File.downloadFileAsync(url, destination, {
      headers: { Authorization: `Bearer ${accessToken}`, 'X-Platform': 'mobile' },
      idempotent: true,
    });

    const asset = await MediaLibrary.Asset.create(file.uri);
    return asset.getUri();
  },
};
