import { z } from 'zod';

export const DateRangeSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});

export const OptionalDateRangeSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
