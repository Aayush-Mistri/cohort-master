import express from 'express';
import mongoose from 'mongoose';
import Message from '../models/message-model.js';
import Chat from '../models/chat-model.js';
import protect from '../middleware/auth-middleware.js';

const router = express.Router();

/**
 * Send message (normal or scheduled)
 */
router.post('/', protect, async (req, res) => {
  try {
    const { chatId, content, scheduledFor } = req.body;

    if (!chatId || !content) {
      return res.status(400).json({ message: 'chatId and content required' });
    }

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: 'Invalid chatId' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Authorization check
    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not a participant of this chat' });
    }

    const message = await Message.create({
      sender: req.user._id,
      chat: chatId,
      content,
      scheduledFor: scheduledFor || null,
      delivered: !scheduledFor
    });

    // Update lastMessage ONLY if message is delivered now
    if (!scheduledFor) {
      await Chat.findByIdAndUpdate(chatId, {
        lastMessage: message._id
      });
    }

    const populatedMessage = await message.populate(
      'sender',
      'name username'
    );

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Get messages of a chat
 */
router.get('/:chatId', protect, async (req, res) => {
  try {
    const { chatId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: 'Invalid chatId' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Authorization check
    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const messages = await Message.find({
      chat: chatId,
      $or: [
        { scheduledFor: null },
        { scheduledFor: { $lte: new Date() } }
      ]
    })
      .populate('sender', 'name username')
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:chatId/read', protect, async (req, res) => {
  try {
    const { chatId } = req.params;

    // Update all messages in this chat that are NOT from current user and NOT read
    await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: req.user._id },
        status: { $ne: 'read' }
      },
      { $set: { status: 'read' } }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
