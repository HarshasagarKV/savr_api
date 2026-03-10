const { z } = require('zod');

const updateProfileSchema = z.object({
  firstName: z.string().trim().max(50).optional(),
  lastName: z.string().trim().max(50).optional()
}).refine((data) => data.firstName !== undefined || data.lastName !== undefined, {
  message: 'At least one field is required'
});

const nearbyRestaurantsQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  maxDistanceKm: z.coerce.number().positive().max(100).default(20)
});

module.exports = {
  updateProfileSchema,
  nearbyRestaurantsQuerySchema
};
