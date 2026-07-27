import mongoose from 'mongoose';

const reactionSchema = new mongoose.Schema({
  emoji: { type: String, required: true },
  userName: { type: String, required: true }
}, { _id: false });

const messageSchema = new mongoose.Schema({
  senderName: { type: String, required: true },
  recipientName: { type: String },
  text: { type: String, default: '' },
  mediaUrl: { type: String },
  status: { type: String, enum: ['sent', 'delivered', 'seen'], default: 'sent' },
  reactions: [reactionSchema],
  isEdited: { type: Boolean, default: false },
  replyTo: { type: Object, default: null },
  // Added time field to permanently store the client's local time string
  time: { type: String, required: true }
}, { timestamps: true, strict: false });

export const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);