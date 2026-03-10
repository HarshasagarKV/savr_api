const connectDB = require('../config/db');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const OtpSession = require('../models/OtpSession');
const RefreshToken = require('../models/RefreshToken');

function hoursToEpoch(hour, minute = 0) {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0, 0).getTime();
}

async function seed() {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    Restaurant.deleteMany({}),
    MenuItem.deleteMany({}),
    Order.deleteMany({}),
    Notification.deleteMany({}),
    OtpSession.deleteMany({}),
    RefreshToken.deleteMany({})
  ]);

  const restaurants = await Restaurant.insertMany([
    {
      storeName: 'Namma Bowl Kitchen',
      ownerName: 'Arun Kumar',
      phone: '+919900000101',
      email: 'namma@savr.com',
      address: '12 MG Road, Bengaluru',
      cuisine: 'South Indian',
      openTimeEpoch: hoursToEpoch(8),
      closeTimeEpoch: hoursToEpoch(23),
      latitude: 12.9756,
      longitude: 77.605,
      imageUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4'
    },
    {
      storeName: 'Silk Route Bites',
      ownerName: 'Meera Singh',
      phone: '+919900000102',
      email: 'silkroute@savr.com',
      address: '21 Indiranagar 100ft Rd, Bengaluru',
      cuisine: 'Pan Asian',
      openTimeEpoch: hoursToEpoch(10),
      closeTimeEpoch: hoursToEpoch(22),
      latitude: 12.9719,
      longitude: 77.6412,
      imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5'
    },
    {
      storeName: 'Koramangala Grill House',
      ownerName: 'Rohit Das',
      phone: '+919900000103',
      email: 'grill@savr.com',
      address: '5th Block Koramangala, Bengaluru',
      cuisine: 'Grill',
      openTimeEpoch: hoursToEpoch(11),
      closeTimeEpoch: hoursToEpoch(23, 30),
      latitude: 12.9352,
      longitude: 77.6245,
      imageUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9'
    }
  ]);

  const admin = await User.create({
    phone: '+919900000001',
    role: 'admin',
    firstName: 'System',
    lastName: 'Admin'
  });

  const users = await User.insertMany([
    { phone: '+919900000011', role: 'user', firstName: 'Asha', lastName: 'Reddy' },
    { phone: '+919900000012', role: 'user', firstName: 'Vikram', lastName: 'Nair' }
  ]);

  const restaurantUsers = await User.insertMany([
    {
      phone: '+919900000201',
      role: 'restaurant',
      firstName: 'Arun',
      lastName: 'K',
      restaurantId: restaurants[0]._id
    },
    {
      phone: '+919900000202',
      role: 'restaurant',
      firstName: 'Meera',
      lastName: 'S',
      restaurantId: restaurants[1]._id
    },
    {
      phone: '+919900000203',
      role: 'restaurant',
      firstName: 'Rohit',
      lastName: 'D',
      restaurantId: restaurants[2]._id
    }
  ]);

  const menuSeed = [
    [
      ['Idli Set', 80, 65],
      ['Masala Dosa', 120, 99],
      ['Bisi Bele Bath', 150, 130],
      ['Curd Rice', 90, 75],
      ['Filter Coffee', 40, 35]
    ],
    [
      ['Veg Sushi Roll', 220, 199],
      ['Pad Thai', 280, 249],
      ['Ramen Bowl', 310, 279],
      ['Thai Green Curry', 330, 295],
      ['Mango Sticky Rice', 170, 149]
    ],
    [
      ['Peri Peri Chicken', 320, 279],
      ['Paneer Skewers', 260, 229],
      ['Smoked Wings', 290, 255],
      ['BBQ Burger', 240, 210],
      ['Loaded Fries', 180, 155]
    ]
  ];

  const allMenuItems = [];
  for (let i = 0; i < restaurants.length; i += 1) {
    for (const [name, actualPrice, discountedPrice] of menuSeed[i]) {
      allMenuItems.push({
        restaurantId: restaurants[i]._id,
        name,
        description: `${name} freshly prepared`,
        actualPrice,
        discountedPrice,
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
        availableFrom: Date.now() - 2 * 60 * 60 * 1000,
        quantity: 50,
        isActive: true
      });
    }
  }

  const menuItems = await MenuItem.insertMany(allMenuItems);

  const order1 = await Order.create({
    userId: users[0]._id,
    restaurantId: restaurants[0]._id,
    restaurantName: restaurants[0].storeName,
    status: 'placed',
    items: [
      {
        foodId: menuItems[0]._id,
        name: menuItems[0].name,
        unitPrice: menuItems[0].discountedPrice,
        quantity: 2
      }
    ],
    totalAmount: menuItems[0].discountedPrice * 2,
    orderedAtEpoch: Date.now() - 60 * 60 * 1000
  });

  const order2 = await Order.create({
    userId: users[1]._id,
    restaurantId: restaurants[1]._id,
    restaurantName: restaurants[1].storeName,
    status: 'completed',
    items: [
      {
        foodId: menuItems[5]._id,
        name: menuItems[5].name,
        unitPrice: menuItems[5].discountedPrice,
        quantity: 1
      },
      {
        foodId: menuItems[6]._id,
        name: menuItems[6].name,
        unitPrice: menuItems[6].discountedPrice,
        quantity: 1
      }
    ],
    totalAmount: menuItems[5].discountedPrice + menuItems[6].discountedPrice,
    orderedAtEpoch: Date.now() - 2 * 24 * 60 * 60 * 1000,
    completedAtEpoch: Date.now() - 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000,
    rating: 4
  });

  await Notification.insertMany([
    {
      userId: users[0]._id,
      title: 'Welcome to savr',
      body: 'Explore top restaurants near you.',
      receivedAtEpoch: Date.now() - 3 * 24 * 60 * 60 * 1000,
      read: false
    },
    {
      userId: users[0]._id,
      title: 'Order update',
      body: `Order ${order1._id} has been placed.`,
      data: { orderId: order1._id.toString() },
      receivedAtEpoch: Date.now() - 30 * 60 * 1000,
      read: false
    },
    {
      userId: users[1]._id,
      title: 'Thanks for your rating',
      body: `You rated order ${order2._id}.`,
      data: { orderId: order2._id.toString() },
      receivedAtEpoch: Date.now() - 24 * 60 * 60 * 1000,
      read: true
    }
  ]);

  console.log('\nSeed complete. Login with OTP in development: 123456\n');
  console.log('Accounts:');
  console.table([
    { role: 'admin', phone: admin.phone, note: 'Admin API role (no OTP route by default)' },
    { role: 'user', phone: users[0].phone, note: 'User app login' },
    { role: 'user', phone: users[1].phone, note: 'User app login' },
    { role: 'restaurant', phone: restaurantUsers[0].phone, note: restaurants[0].storeName },
    { role: 'restaurant', phone: restaurantUsers[1].phone, note: restaurants[1].storeName },
    { role: 'restaurant', phone: restaurantUsers[2].phone, note: restaurants[2].storeName }
  ]);

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
