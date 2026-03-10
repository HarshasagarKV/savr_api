const { z } = require('zod');

const createOrderSchema = z.object({
  restaurantId: z.string().min(1),
  items: z
    .array(
      z.object({
        foodId: z.string().min(1),
        quantity: z.number().int().min(1)
      })
    )
    .min(1)
});

const ratingSchema = z.object({
  rating: z.number().int().min(1).max(5)
});

const statusQuerySchema = z.object({
  status: z.enum(['placed', 'completed']).optional()
});

module.exports = {
  createOrderSchema,
  ratingSchema,
  statusQuerySchema
};
