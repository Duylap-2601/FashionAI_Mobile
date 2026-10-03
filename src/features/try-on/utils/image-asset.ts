import type { ImagePickerAsset } from 'expo-image-picker';

export interface UploadableImage {
  uri: string;
  name: string;
  type: string;
  size?: number;
}

function extensionFromMimeType(mimeType?: string): string {
  if (mimeType === 'image/png') return 'png';
  return 'jpg';
}

export function toUploadableImage(asset: ImagePickerAsset): UploadableImage {
  const type = asset.mimeType ?? 'image/jpeg';
  const name = asset.fileName ?? `photo-${Date.now()}.${extensionFromMimeType(type)}`;
  return { uri: asset.uri, name, type, size: asset.fileSize };
}
