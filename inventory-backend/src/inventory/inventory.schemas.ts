import { z } from 'zod';

export const AdjustStockSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  source: z.enum(['PURCHASE', 'SALE', 'DAMAGE', 'EXPIRED', 'MANUAL']),
  referenceId: z.string().uuid().optional(),
});

export type AdjustStockDto = z.infer<typeof AdjustStockSchema>;
