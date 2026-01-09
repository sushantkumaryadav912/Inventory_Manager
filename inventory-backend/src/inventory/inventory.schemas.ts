import { z } from 'zod';

const AdjustStockBackendSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  type: z.enum(['IN', 'OUT', 'ADJUSTMENT']),
  source: z.enum(['PURCHASE', 'SALE', 'DAMAGE', 'EXPIRED', 'MANUAL']),
  referenceId: z.string().uuid().optional(),
});

const AdjustStockOrbisSchema = z.object({
  itemId: z.string().uuid(),
  delta: z.number().finite().refine((v) => v !== 0, { message: 'delta must be non-zero' }),
  reason: z.string().min(1),
  notes: z.string().min(1).optional(),
});

export const AdjustStockSchema = z.union([AdjustStockBackendSchema, AdjustStockOrbisSchema]);

export type AdjustStockDto = z.infer<typeof AdjustStockSchema>;

export const InventoryUnitSchema = z.string().min(1);

export const CreateInventoryItemSchema = z.object({
  name: z.string().min(1),
  sku: z.string().min(1),
  category: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  quantity: z.number().int().nonnegative(),
  unit: InventoryUnitSchema.optional(),
  costPrice: z.number().nonnegative(),
  sellingPrice: z.number().nonnegative(),
  reorderLevel: z.number().int().nonnegative(),
});

export const UpdateInventoryItemSchema = CreateInventoryItemSchema.partial().extend({
  sku: z.string().min(1).optional(),
});

export const StockHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const BulkImportSchema = z.object({
  items: z.array(CreateInventoryItemSchema).min(1).max(500),
});

export type CreateInventoryItemDto = z.infer<typeof CreateInventoryItemSchema>;
export type UpdateInventoryItemDto = z.infer<typeof UpdateInventoryItemSchema>;
