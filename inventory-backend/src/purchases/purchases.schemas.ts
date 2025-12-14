import { z } from 'zod';

export const PurchaseItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  costPrice: z.number().nonnegative(),
});

export const CreatePurchaseSchema = z.object({
  supplierId: z.string().uuid().optional(),
  items: z.array(PurchaseItemSchema).min(1),
});

export type CreatePurchaseDto = z.infer<typeof CreatePurchaseSchema>;
