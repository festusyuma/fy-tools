import z from 'zod';

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(0).optional().default(0),
  size: z.coerce.number().int().min(0).optional().default(10),
  totalPages: z.coerce.number().int().min(0).optional().default(0),
  totalItems: z.coerce.number().int().min(0).optional().default(0),
});

export type PaginationData = z.TypeOf<typeof PaginationSchema>
