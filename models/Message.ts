import mongoose from 'mongoose';

const reactionSchema = new mongoose.Schema({
  emoji: { type: String, required: true },
  userName: { type: String, required: true }
}, { _id: false });

const messageSchema = new mongoose.Schema({
  senderName: { type: String, required: true },
  recipientName: { type: String }, // Made optional to prevent legacy validation crashes
  text: { type: String, default: '' },
  mediaUrl: { type: String },
  status: { type: String, enum: ['sent', 'delivered', 'seen'], default: 'sent' },
  reactions: [reactionSchema],
  isEdited: { type: Boolean, default: false },
  
  // 👇 Added this to save replies permanently 👇
  replyTo: { 
    type: Object, 
    default: null 
  }
}, { timestamps: true, strict: false }); // Added strict: false as a safety net

export const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);