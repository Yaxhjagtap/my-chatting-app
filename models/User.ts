import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: '😎' },
  lastSeen: { type: Date, default: Date.now },
  isOnline: { type: Boolean, default: false },
  
  // 👇 Changed to Object to save different backgrounds for different partners 👇
  chatBackgrounds: { type: Object, default: {} }
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

User.collection.dropIndex('username_1').catch(() => {});

export { User };