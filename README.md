# savr API (Express + MongoDB)

Backend for the savr React Native app with OTP auth, JWT, RBAC, Zod validation, seed data, and Postman collection.

## Features
- Node.js + Express + MongoDB + Mongoose
- JWT access token + refresh token (httpOnly cookie)
- OTP login by phone (`123456` in development)
- Roles: `user`, `restaurant`, `admin`
- Zod request validation
- Security middleware: `helmet`, `cors`, `morgan`, `express-rate-limit`
- Central error handling + async handler
- Seed script with Bengaluru-like demo data

## Setup
1. Install dependencies:
```bash
npm install
```
2. Create env file:
```bash
cp .env.example .env
```
3. Ensure local MongoDB is running and keep:
```env
MONGO_URI=mongodb://localhost:27017/savr
```
4. Seed data:
```bash
npm run seed
```
5. Start API:
```bash
npm run dev
```

Health endpoint:
```bash
curl http://localhost:4000/health
```

## Environment variables
See `.env.example`:
- `PORT`
- `NODE_ENV`
- `MONGO_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES`
- `JWT_REFRESH_EXPIRES`
- `CORS_ORIGIN`
- `BCRYPT_SALT_ROUNDS`
- `OTP_TTL_MINUTES`

## OTP behavior in development
- OTP is fixed as `123456` when `NODE_ENV=development`
- `/api/v1/auth/request-otp` also returns `devOtp` in development mode
- OTP is still hashed and stored in DB

## Auth flow
1. Request OTP (`/auth/request-otp`)
2. Verify OTP (`/auth/verify-otp`) to get:
- `token` (access token for `Authorization: Bearer <token>`)
- `refreshToken` stored as `httpOnly` cookie
3. Refresh access token (`/auth/refresh`)
4. Logout (`/auth/logout`) revokes refresh token
5. Current user (`/auth/me`)

## Seeded accounts
Printed by `npm run seed`.
- Admin: `+919900000001`
- Users: `+919900000011`, `+919900000012`
- Restaurants: `+919900000201`, `+919900000202`, `+919900000203`
- OTP (dev): `123456`

## Sample curl

### Auth
```bash
curl -X POST http://localhost:4000/api/v1/auth/request-otp \
  -H 'Content-Type: application/json' \
  -d '{"phone":"+919900000011","role":"user"}'
```

```bash
curl -X POST http://localhost:4000/api/v1/auth/verify-otp \
  -H 'Content-Type: application/json' \
  -c cookies.txt \
  -d '{"phone":"+919900000011","role":"user","requestId":"<REQUEST_ID>","otp":"123456"}'
```

```bash
curl -X POST http://localhost:4000/api/v1/auth/refresh -b cookies.txt
```

### User profile
```bash
curl http://localhost:4000/api/v1/users/profile \
  -H 'Authorization: Bearer <ACCESS_TOKEN>'
```

### Nearby restaurants
```bash
curl "http://localhost:4000/api/v1/users/restaurants/nearby?latitude=12.9716&longitude=77.5946&maxDistanceKm=10" \
  -H 'Authorization: Bearer <ACCESS_TOKEN>'
```

### Create order
```bash
curl -X POST http://localhost:4000/api/v1/users/orders \
  -H 'Authorization: Bearer <ACCESS_TOKEN>' \
  -H 'Content-Type: application/json' \
  -d '{"restaurantId":"<RESTAURANT_ID>","items":[{"foodId":"<FOOD_ID>","quantity":2}]}'
```

### Notifications
```bash
curl http://localhost:4000/api/v1/users/notifications \
  -H 'Authorization: Bearer <ACCESS_TOKEN>'
```

### Restaurant dashboard
```bash
curl http://localhost:4000/api/v1/restaurant/dashboard \
  -H 'Authorization: Bearer <RESTAURANT_ACCESS_TOKEN>'
```

### Admin overview
```bash
curl http://localhost:4000/api/v1/admin/overview \
  -H 'Authorization: Bearer <ADMIN_ACCESS_TOKEN>'
```

## Postman import
1. Open Postman.
2. Click **Import**.
3. Select `postman_collection.json`.
4. Set variables:
- `baseUrl` (default `http://localhost:4000/api/v1`)
- `accessToken`
- `requestId`
- `restaurantId`, `foodId`, `orderId`, `userId`
