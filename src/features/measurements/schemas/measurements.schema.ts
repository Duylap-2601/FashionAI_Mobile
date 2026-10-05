import { z } from 'zod';

export const measurementSchema = z.object({
  height: z.string().optional(),
  weight: z.string().optional(),
  chest: z.string().optional(),
  waist: z.string().optional(),
  hip: z.string().optional(),
  shoulder: z.string().optional(),
  neck: z.string().optional(),
  underbust: z.string().optional(),
  shirtLength: z.string().optional(),
  bodyLength: z.string().optional(),
  sleeveLength: z.string().optional(),
  wrist: z.string().optional(),
  thigh: z.string().optional(),
  inseam: z.string().optional(),
  knee: z.string().optional(),
  calf: z.string().optional(),
  outseam: z.string().optional(),
  trouserLength: z.string().optional(),
});

export type MeasurementFormValues = z.infer<typeof measurementSchema>;
