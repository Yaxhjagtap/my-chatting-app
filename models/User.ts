import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String },
  lastSeen: { type: Date, default: Date.now },
  isOnline: { type: Boolean, default: false },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

// Automatically clear out stale legacy indexes from previous iterations
User.collection.dropIndex('username_1').catch(() => {});

export { User };