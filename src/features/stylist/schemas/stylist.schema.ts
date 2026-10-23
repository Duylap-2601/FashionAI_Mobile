import { z } from 'zod';

export const stylistFormSchema = z.object({
  occasion: z.string().trim().max(200, 'Dịp mặc không được vượt quá 200 ký tự'),
  stylePreference: z
    .string()
    .trim()
    .max(200, 'Phong cách không được vượt quá 200 ký tự'),
  budget: z.string().trim().max(100, 'Ngân sách không được vượt quá 100 ký tự'),
  genderPreference: z.enum(['', 'male', 'female', 'other']),
});

export type StylistFormValues = z.infer<typeof stylistFormSchema>;
