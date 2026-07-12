import express from 'express';
import mongoose from 'mongoose';
import Chat from '../models/chat-model.js';
import User from '../models/user-model.js';
import protect from '../middleware/auth-middleware.js';

const router = express.Router();
const PARTICIPANT_SELECT = 'name username profilePic bio whoAmI aboutInfo education interests';
const toId = (value) => value?.toString();
const isFriend = (user, otherUserId) => (
  (user?.friends || []).some((friendId) => toId(friendId) === toId(otherUserId))
);

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

    const currentUser = await User.findById(req.user._id).select('friends');
    if (!isFriend(currentUser, userId)) {
      return res.status(403).json({ message: 'You can only start chats with contacts.' });
    }

    // Check if chat already exists
    const existingChat = await Chat.findOne({
      isGroup: false,
      participants: { $all: [req.user._id, userId] }
    }).populate('participants', PARTICIPANT_SELECT);

    if (existingChat) {
      return res.json(existingChat);
    }

    const chat = await Chat.create({
      participants: [req.user._id, userId],
      isGroup: false,
      kind: 'direct'
    });

    const populated = await chat.populate('participants', PARTICIPANT_SELECT);
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
    const currentUser = await User.findById(req.user._id).select('friends');
    const invalidUsers = uniqueUsers.filter((id) => !isFriend(currentUser, id));
    if (invalidUsers.length > 0) {
      return res.status(403).json({
        message: 'Group chats can only include your contacts.'
      });
    }

    const chat = await Chat.create({
      name,
      isGroup: true,
      kind: 'group',
      participants: [req.user._id, ...uniqueUsers],
      admin: req.user._id
    });

    const populated = await chat.populate('participants', PARTICIPANT_SELECT);
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
      .populate('participants', PARTICIPANT_SELECT)
      .populate('community', 'name icon creator admins')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'sender',
          select: PARTICIPANT_SELECT
        }
      })
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
