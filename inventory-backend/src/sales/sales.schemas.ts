import { z } from 'zod';

export const SaleItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  sellingPrice: z.number().nonnegative(),
});

export const CreateSaleSchema = z.object({
  customerId: z.string().uuid().optional(),
  paymentMethod: z.enum(['CASH', 'UPI', 'CARD', 'BANK']),
  items: z.array(SaleItemSchema).min(1),
});

export type CreateSaleDto = z.infer<typeof CreateSaleSchema>;
