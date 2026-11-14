import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { pickEvidenceImages } from '@/features/orders/utils/evidence-images';

export interface PickedReviewImages {
  images: string[];
  rejectedSize: number;
  rejectedType: number;
  cancelled: boolean;
}

/**
 * Ảnh đánh giá gửi dạng data URL (BE nhận `images: string[]` như web).
 * Ảnh được nén lại để payload không quá lớn khi gửi JSON.
 */
export async function pickReviewImages(remaining: number): Promise<PickedReviewImages> {
  const picked = await pickEvidenceImages(remaining);
  if (picked.cancelled) {
    return {
      images: [],
      rejectedSize: picked.rejectedSize,
      rejectedType: picked.rejectedType,
      cancelled: true,
    };
  }

  const images: string[] = [];
  for (const image of picked.images) {
    try {
      const ref = await ImageManipulator.manipulate(image.uri)
        .resize({ width: 1200 })
        .renderAsync();
      const saved = await ref.saveAsync({
        format: SaveFormat.JPEG,
        compress: 0.6,
        base64: true,
      });
      if (saved.base64) images.push(`data:image/jpeg;base64,${saved.base64}`);
    } catch {
      // Ảnh lỗi thì bỏ, các ảnh còn lại vẫn gửi được.
    }
  }

  return {
    images,
    rejectedSize: picked.rejectedSize,
    rejectedType: picked.rejectedType,
    cancelled: false,
  };
}
