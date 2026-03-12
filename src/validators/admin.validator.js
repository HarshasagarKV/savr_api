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

const phoneRegex = /^\+?[1-9]\d{7,14}$/;

const restaurantPayloadBase = {
  storeName: z.string().trim().min(1),
  ownerName: z.string().trim().min(1),
  phone: z.string().regex(phoneRegex, 'Invalid phone format'),
  email: z.string().email(),
  address: z.string().trim().min(3),
  cuisine: z.string().trim().min(2),
  openTimeEpoch: z.number().int().nonnegative(),
  closeTimeEpoch: z.number().int().nonnegative(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  imageUrl: z.string().url().nullable().optional()
};

const createRestaurantSchema = z.object({
  ...restaurantPayloadBase,
  loginPhone: z.string().regex(phoneRegex, 'Invalid phone format').optional()
});

const updateRestaurantSchema = z.object({
  storeName: restaurantPayloadBase.storeName.optional(),
  ownerName: restaurantPayloadBase.ownerName.optional(),
  phone: restaurantPayloadBase.phone.optional(),
  email: restaurantPayloadBase.email.optional(),
  address: restaurantPayloadBase.address.optional(),
  cuisine: restaurantPayloadBase.cuisine.optional(),
  openTimeEpoch: restaurantPayloadBase.openTimeEpoch.optional(),
  closeTimeEpoch: restaurantPayloadBase.closeTimeEpoch.optional(),
  latitude: restaurantPayloadBase.latitude.optional(),
  longitude: restaurantPayloadBase.longitude.optional(),
  imageUrl: restaurantPayloadBase.imageUrl
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field is required'
});

module.exports = {
  paginationQuerySchema,
  adminUsersQuerySchema,
  adminOrdersQuerySchema,
  statusUpdateSchema,
  createRestaurantSchema,
  updateRestaurantSchema
};
