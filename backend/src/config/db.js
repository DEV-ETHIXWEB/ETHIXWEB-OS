const mongoose = require('mongoose');

// Cached across invocations on serverless platforms (Vercel reuses warm
// containers), so we don't reconnect to MongoDB on every request. Falls back
// to a fresh connection on cold starts. Harmless on persistent-process hosts
// (Railway/Render/Fly/local dev) too, since connectDB is only ever called
// once there anyway.
let cached = global._mongooseConn;
if (!cached) cached = global._mongooseConn = { conn: null, promise: null };

async function connectDB(uri) {
  if (!uri) throw new Error('MONGODB_URI is not set');
  if (cached.conn) return cached.conn;

  mongoose.set('strictQuery', true);
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(uri, { serverSelectionTimeoutMS: 10_000 })
      .then((m) => {
        console.log('MongoDB Connected');
        return m;
      })
      .catch((err) => {
        cached.promise = null;
        console.error('MongoDB connection error:', err);
        throw err;
      });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = { connectDB };
