import express from 'express';
import mongoose from 'mongoose';
import Chat from '../models/chat-model.js';
import User from '../models/user-model.js';
import protect from '../middleware/auth-middleware.js';

const router = express.Router();

/**
 * Create 1–1 chat (no friend requirement - anyone can chat with anyone)
 */
router.post('/', protect, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'User ID required' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    // Verify target user exists
    const targetUser = await User.findById(userId).select('_id name username');
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if chat already exists
    const existingChat = await Chat.findOne({
      isGroup: false,
      participants: { $all: [req.user._id, userId] }
    }).populate('participants', 'name username profilePic');

    if (existingChat) {
      return res.json(existingChat);
    }

    const chat = await Chat.create({
      participants: [req.user._id, userId],
      isGroup: false,
      kind: 'direct'
    });

    const populated = await chat.populate('participants', 'name username profilePic');
    res.status(201).json(populated);
  } catch (error) {
    console.error('Chat creation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Create group chat (no friend requirement)
 */
router.post('/group', protect, async (req, res) => {
  try {
    const { name, users } = req.body;

    if (!name || !users || users.length < 1) {
      return res.status(400).json({
        message: 'Group name and at least 1 other user required'
      });
    }

    const uniqueUsers = [...new Set(users.map(id => id.toString()))];

    const chat = await Chat.create({
      name,
      isGroup: true,
      kind: 'group',
      participants: [req.user._id, ...uniqueUsers],
      admin: req.user._id
    });

    const populated = await chat.populate('participants', 'name username profilePic');
    res.status(201).json(populated);
  } catch (error) {
    console.error('Group chat creation error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Get all chats for logged-in user
 */
router.get('/', protect, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id
    })
      .populate('participants', 'name username profilePic')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: 'name username profilePic'
        }
      })
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
