import { z } from 'zod';

export const SupplierSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
});

export const CustomerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional(),
});

export type CreateSupplierDto = z.infer<typeof SupplierSchema>;
export type CreateCustomerDto = z.infer<typeof CustomerSchema>;
