import mongoose from 'mongoose';

const scheduledMessageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    chat: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Chat',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    scheduleType: {
      type: String,
      enum: ['once', 'daily', 'weekly', 'monthly', 'custom'],
      default: 'once'
    },
    scheduledFor: {
      type: Date,
      required: true
    },
    customInterval: {
      type: Number,
      default: 1
    },
    customUnit: {
      type: String,
      enum: ['days', 'weeks', 'months'],
      default: 'days'
    },
    endsAt: {
      type: Date,
      default: null
    },
    active: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

export default mongoose.model('ScheduledMessage', scheduledMessageSchema);
