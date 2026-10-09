import { z } from 'zod';
import { TryOnCategory } from '@/features/try-on/types/try-on';

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
export const VALID_IMAGE_TYPES = new Set(['image/png', 'image/jpeg']);

const pickedImageSchema = z.object({
  uri: z.string().min(1),
  type: z.string().refine((type) => VALID_IMAGE_TYPES.has(type), {
    message: 'Vui lòng chọn ảnh PNG hoặc JPEG.',
  }),
  size: z
    .number()
    .max(MAX_IMAGE_SIZE_BYTES, 'Ảnh vượt quá 10MB. Vui lòng chọn ảnh nhỏ hơn.')
    .optional(),
});

export type PickedImage = z.infer<typeof pickedImageSchema>;

export function validatePickedImage(image: PickedImage): string | null {
  const result = pickedImageSchema.safeParse(image);
  return result.success ? null : result.error.issues[0]?.message ?? 'Ảnh không hợp lệ.';
}

export interface ComboSlot {
  productId: string;
  category: TryOnCategory;
}

export function validateCombo(upper: ComboSlot | null, lower: ComboSlot | null): string | null {
  if (upper && lower && upper.productId === lower.productId) {
    return 'Không thể chọn cùng một món cho cả hai ô.';
  }
  if (upper && upper.category !== 'UPPER') {
    return 'Món ở ô Áo chưa phù hợp danh mục.';
  }
  if (lower && lower.category !== 'LOWER') {
    return 'Món ở ô Quần chưa phù hợp danh mục.';
  }
  return null;
}
