import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { IEvidenceImage } from '../types/order';

export const EVIDENCE_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const MAX_EVIDENCE_IMAGE_BYTES = 10 * 1024 * 1024;
export const MAX_ISSUE_EVIDENCE_IMAGES = 10;
export const MAX_DISPUTE_EVIDENCE_IMAGES = 5;
export const MAX_CHAT_ATTACHMENTS = 3;
export const MAX_REVIEW_IMAGES = 5;

const MAX_IMAGE_WIDTH = 1600;
const JPEG_QUALITY = 0.7;

export interface PickedEvidenceImages {
  images: IEvidenceImage[];
  rejectedSize: number;
  rejectedType: number;
  cancelled: boolean;
}

function toJpegName(name: string | null | undefined, index: number): string {
  const base = name?.replace(/\.[^.]+$/, '').trim();
  return base ? `${base}.jpg` : `evidence_${Date.now()}_${index}.jpg`;
}

async function normalizeImage(
  asset: ImagePicker.ImagePickerAsset,
  index: number,
): Promise<IEvidenceImage | null> {
  try {
    const ref = await ImageManipulator.manipulate(asset.uri).resize({ width: MAX_IMAGE_WIDTH }).renderAsync();
    const saved = await ref.saveAsync({ format: SaveFormat.JPEG, compress: JPEG_QUALITY });
    return {
      uri: saved.uri,
      name: toJpegName(asset.fileName, index),
      type: 'image/jpeg',
    };
  } catch {
    return null;
  }
}

/**
 * Chọn ảnh từ thư viện và chuẩn hoá về JPEG để BE luôn nhận đúng định dạng/kích thước.
 * Trả về số ảnh bị loại để UI hiện thông báo thay vì im lặng.
 */
export async function pickEvidenceImages(remaining: number): Promise<PickedEvidenceImages> {
  const empty = { images: [] as IEvidenceImage[], rejectedSize: 0, rejectedType: 0, cancelled: true };
  if (remaining <= 0) return empty;

  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return empty;

  let result: ImagePicker.ImagePickerResult;
  try {
    result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: remaining,
      quality: 0.8,
    });
  } catch {
    return empty;
  }

  if (result.canceled || !result.assets?.length) return empty;

  let rejectedSize = 0;
  let rejectedType = 0;
  const images: IEvidenceImage[] = [];

  for (let index = 0; index < result.assets.length; index += 1) {
    const asset = result.assets[index];

    if (asset.fileSize !== undefined && asset.fileSize > MAX_EVIDENCE_IMAGE_BYTES) {
      rejectedSize += 1;
      continue;
    }

    if (asset.mimeType && !asset.mimeType.startsWith('image/')) {
      rejectedType += 1;
      continue;
    }

    const normalized = await normalizeImage(asset, index);
    if (!normalized) {
      rejectedType += 1;
      continue;
    }

    images.push(normalized);
  }

  return { images, rejectedSize, rejectedType, cancelled: false };
}

export function describeEvidenceRejection(rejectedSize: number, rejectedType: number): string | null {
  const parts: string[] = [];
  if (rejectedType > 0) parts.push(`${rejectedType} ảnh không đọc được`);
  if (rejectedSize > 0) parts.push(`${rejectedSize} ảnh vượt quá 10MB`);
  if (parts.length === 0) return null;
  return `${parts.join(' · ')}. Vui lòng chọn ảnh JPEG/PNG/WEBP khác.`;
}
