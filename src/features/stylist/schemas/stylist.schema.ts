import { z } from 'zod';

export const stylistFormSchema = z.object({
  garmentDescription: z
    .string()
    .trim()
    .min(3, 'Vui lòng mô tả trang phục cần tư vấn')
    .max(500, 'Mô tả trang phục không được vượt quá 500 ký tự'),
  occasion: z.string().trim().max(200, 'Dịp mặc không được vượt quá 200 ký tự'),
  stylePreference: z
    .string()
    .trim()
    .max(200, 'Phong cách không được vượt quá 200 ký tự'),
  budget: z.string().trim().max(100, 'Ngân sách không được vượt quá 100 ký tự'),
  genderPreference: z.enum(['', 'male', 'female', 'other']),
});

export type StylistFormValues = z.infer<typeof stylistFormSchema>;
