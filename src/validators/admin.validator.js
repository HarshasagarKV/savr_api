const { z } = require('zod');

const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional()
});

const adminUsersQuerySchema = paginationQuerySchema.extend({
  role: z.enum(['user', 'restaurant', 'admin']).optional()
});

const adminOrdersQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['placed', 'completed']).optional()
});

const statusUpdateSchema = z.object({
  isActive: z.boolean()
});

module.exports = {
  paginationQuerySchema,
  adminUsersQuerySchema,
  adminOrdersQuerySchema,
  statusUpdateSchema
};
