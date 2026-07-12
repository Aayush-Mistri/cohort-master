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
      enum: ['text', 'image', 'file', 'poll', 'system'],
      default: 'text'
    },

    attachments: [
      {
        url: { type: String, required: true },
        fileName: { type: String, default: '' },
        mimeType: { type: String, default: '' },
        size: { type: Number, default: 0 }
      }
    ],

    replyTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message',
      default: null
    },

    editedAt: {
      type: Date,
      default: null
    },

    editedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    deletedAt: {
      type: Date,
      default: null
    },

    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    isDeleted: {
      type: Boolean,
      default: false
    },

    readBy: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    ],

    mentions: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    ],

    poll: {
      question: { type: String, default: '' },
      options: [
        {
          option: { type: String, required: true },
          votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
        }
      ]
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
    },

    reactions: [
      {
        emoji: { type: String, required: true },
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
        createdAt: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

messageSchema.index({ chat: 1, createdAt: 1 });
messageSchema.index({ content: 'text' });

export default mongoose.model('Message', messageSchema);
