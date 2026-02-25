import express from 'express';
import mongoose from 'mongoose';
import Chat from '../models/chat-model.js';
import User from '../models/user-model.js';
import protect from '../middleware/auth-middleware.js';

const router = express.Router();

/**
 * Create 1–1 chat
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

    const currentUser = await User.findById(req.user._id).select('friends');
    const isFriend = currentUser?.friends?.some(
      (friendId) => friendId.toString() === userId.toString()
    );

    if (!isFriend) {
      return res.status(403).json({ message: 'You can only start direct chats with friends.' });
    }

    // Check if chat already exists
    const existingChat = await Chat.findOne({
      isGroup: false,
      participants: { $all: [req.user._id, userId] }
    });

    if (existingChat) {
      return res.json(existingChat);
    }

    const chat = await Chat.create({
      participants: [req.user._id, userId],
      isGroup: false
    });

    res.status(201).json(chat);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Create group chat
 */
router.post('/group', protect, async (req, res) => {
  try {
    const { name, users } = req.body;

    if (!name || !users || users.length < 2) {
      return res.status(400).json({
        message: 'Group name and at least 2 users required'
      });
    }

    const uniqueUsers = [...new Set(users.map(id => id.toString()))];
    const currentUser = await User.findById(req.user._id).select('friends');
    const friendIds = new Set((currentUser?.friends || []).map((id) => id.toString()));
    const nonFriends = uniqueUsers.filter((id) => !friendIds.has(id));

    if (nonFriends.length > 0) {
      return res.status(403).json({ message: 'Group chats can only include your friends.' });
    }

    const chat = await Chat.create({
      name,
      isGroup: true,
      participants: [req.user._id, ...uniqueUsers],
      admin: req.user._id
    });

    res.status(201).json(chat);
  } catch (error) {
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
