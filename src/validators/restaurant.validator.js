const { z } = require('zod');

const updateRestaurantProfileSchema = z.object({
  storeName: z.string().trim().min(1),
  ownerName: z.string().trim().min(1),
  phone: z.string().regex(/^\+?[1-9]\d{7,14}$/),
  email: z.string().email(),
  address: z.string().trim().min(3),
  cuisine: z.string().trim().min(2),
  openTimeEpoch: z.number().int().nonnegative(),
  closeTimeEpoch: z.number().int().nonnegative(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  imageUrl: z.string().url().nullable().optional()
});

const upsertMenuItemSchema = z.object({
  imageUrl: z.string().url().nullable().optional(),
  name: z.string().trim().min(1),
  description: z.string().trim().default(''),
  actualPrice: z.number().nonnegative(),
  discountedPrice: z.number().nonnegative(),
  availableFrom: z.number().int().nonnegative(),
  quantity: z.number().int().min(0)
}).refine((data) => data.discountedPrice <= data.actualPrice, {
  message: 'discountedPrice must be less than or equal to actualPrice',
  path: ['discountedPrice']
});

module.exports = {
  updateRestaurantProfileSchema,
  upsertMenuItemSchema
};
