import { z } from 'zod';

export const createReviewSchema = z.object({
  rating: z.number().int().min(1, 'Vui lòng chọn số sao.').max(5),
  comment: z.string(),
});

export const updateReviewSchema = z.object({
  comment: z.string(),
});

export type CreateReviewFormValues = z.infer<typeof createReviewSchema>;
export type UpdateReviewFormValues = z.infer<typeof updateReviewSchema>;
