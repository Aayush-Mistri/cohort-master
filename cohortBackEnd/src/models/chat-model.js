import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    isGroup: { type: Boolean, default: false },

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
