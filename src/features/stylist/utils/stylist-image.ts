import type {
  IStylistImageFile,
  StylistImageMimeType,
} from '../types/stylist';

const MAX_STYLIST_IMAGE_BYTES = 10 * 1024 * 1024;

interface StylistImageAsset {
  uri: string;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number;
}

type StylistImageResult =
  | { file: IStylistImageFile }
  | { error: string };

function inferMimeType(asset: StylistImageAsset): StylistImageMimeType | null {
  const mimeType = asset.mimeType?.toLowerCase();
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') return 'image/jpeg';
  if (mimeType === 'image/png') return 'image/png';
  if (mimeType === 'image/webp') return 'image/webp';

  const name = (asset.fileName || asset.uri).split('?')[0]?.toLowerCase() ?? '';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.webp')) return 'image/webp';
  return null;
}

function extensionFor(type: StylistImageMimeType): string {
  if (type === 'image/png') return 'png';
  if (type === 'image/webp') return 'webp';
  return 'jpg';
}

export function toStylistImageFile(
  asset: StylistImageAsset,
): StylistImageResult {
  if (asset.fileSize !== undefined && asset.fileSize > MAX_STYLIST_IMAGE_BYTES) {
    return {
      error: 'Ảnh vượt quá giới hạn 10 MB. Vui lòng chọn ảnh nhỏ hơn.',
    };
  }

  const type = inferMimeType(asset);
  if (!type) {
    return {
      error: 'Định dạng ảnh chưa được hỗ trợ. Hãy chọn ảnh JPEG, PNG hoặc WebP.',
    };
  }

  return {
    file: {
      uri: asset.uri,
      name: asset.fileName?.trim() || `stylist-photo.${extensionFor(type)}`,
      type,
    },
  };
}
