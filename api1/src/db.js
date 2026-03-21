const mongoose = require('mongoose');

async function connectDb() {
  await mongoose.connect(process.env.DATABASE_URL);
  console.log('MongoDB connected');
}

const userSchema = new mongoose.Schema({
  email:         { type: String, unique: true, required: true, lowercase: true, trim: true },
  password_hash: { type: String, required: true },
  created_at:    { type: Date, default: Date.now },
});

const User = mongoose.model('User', userSchema);

module.exports = { connectDb, User };
