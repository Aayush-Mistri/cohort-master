import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat'
    },

    content: String,

    type: {
      type: String,
      enum: ['text', 'image', 'file'],
      default: 'text'
    },

    scheduledFor: {
      type: Date,
      default: null
    },

    delivered: {
      type: Boolean,
      default: true
    },

    status: {
      type: String,
      enum: ['sent', 'delivered', 'read'],
      default: 'sent'
    }
  },
  { timestamps: true }
);

export default mongoose.model('Message', messageSchema);
