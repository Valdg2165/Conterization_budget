const mongoose = require('mongoose');

async function connectDb() {
  await mongoose.connect(process.env.DATABASE_URL);
  console.log('Powens MongoDB connected');
}

// Stores one record per our-app user
const powensUserSchema = new mongoose.Schema({
  user_id:      { type: String, required: true, unique: true }, // our auth user's _id
  access_token: { type: String, required: true },               // Powens permanent token
  connection_ids: [{ type: String }],                           // Powens connection IDs added over time
  created_at:   { type: Date, default: Date.now },
  updated_at:   { type: Date, default: Date.now },
});

const PowensUser = mongoose.model('PowensUser', powensUserSchema);

module.exports = { connectDb, PowensUser };
