const mongoose = require('mongoose');
const env = require('./env');

async function connectDB() {
  await mongoose.connect(env.mongoUri);
}

module.exports = connectDB;
