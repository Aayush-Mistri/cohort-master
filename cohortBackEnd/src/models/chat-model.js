import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    isGroup: { type: Boolean, default: false },

    kind: {
      type: String,
      enum: ['direct', 'group', 'community-announcement'],
      default: 'direct'
    },

    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group',
      default: null
    },

    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      default: null
    },

    name: {
      type: String,
      required: function () {
        return this.isGroup;
      }
    },

    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    ],

    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    }
  },
  { timestamps: true }
);

export default mongoose.model('Chat', chatSchema);
