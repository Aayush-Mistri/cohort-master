import express from 'express';
import mongoose from 'mongoose';
import Message from '../models/message-model.js';
import Chat from '../models/chat-model.js';
import ScheduledMessage from '../models/scheduled-message-model.js';
import Group from '../models/group-model.js';
import Community from '../models/community-model.js';
import User from '../models/user-model.js';
import protect from '../middleware/auth-middleware.js';
import messageUpload from '../middleware/message-upload-middleware.js';

const router = express.Router();

const toId = (value) => value?.toString();

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const extractMentions = (content = '') => {
  if (!content || typeof content !== 'string') return [];
  const matches = content.match(/@([a-zA-Z0-9_]{2,})/g) || [];
  return [...new Set(matches.map((m) => m.substring(1)))];
};

const isGroupAdmin = (group, userId) => {
  if (!group) return false;
  const id = toId(userId);
  if (toId(group.creator) === id) return true;
  return (group.admins || []).some((adminId) => toId(adminId) === id);
};

const isCommunityAdmin = (community, userId) => {
  if (!community) return false;
  const id = toId(userId);
  if (toId(community.creator) === id) return true;
  return (community.admins || []).some((adminId) => toId(adminId) === id);
};

const ensureParticipant = (chat, userId) => (
  (chat.participants || []).some((id) => toId(id) === toId(userId))
);

const buildMessageType = (attachments, poll, explicitType) => {
  if (explicitType) return explicitType;
  if (poll) return 'poll';
  if (attachments && attachments.length > 0) {
    const isImage = attachments.some((att) => (att.mimeType || '').startsWith('image/'));
    return isImage ? 'image' : 'file';
  }
  return 'text';
};

const populateMessage = (query) => (
  query
    .populate('sender', 'name username profilePic')
    .populate({
      path: 'replyTo',
      populate: {
        path: 'sender',
        select: 'name username profilePic'
      }
    })
);

const emitNotifications = async ({ req, chat, message, mentionIds, community }) => {
  const io = req.app.get('io');
  const onlineUsers = req.app.get('onlineUsers');
  if (!io || !onlineUsers) return;

  if (mentionIds && mentionIds.length > 0) {
    mentionIds.forEach((id) => {
      const socketId = onlineUsers.get(toId(id));
      if (socketId) {
        io.to(socketId).emit('notification', {
          type: 'mention',
          chatId: chat._id,
          messageId: message._id,
          from: message.sender,
          content: message.content
        });
      }
    });
  }

  if (chat.kind === 'community-announcement' && community) {
    (community.members || []).forEach((memberId) => {
      if (toId(memberId) === toId(message.sender)) return;
      const socketId = onlineUsers.get(toId(memberId));
      if (socketId) {
        io.to(socketId).emit('notification', {
          type: 'announcement',
          communityId: community._id,
          chatId: chat._id,
          messageId: message._id,
          content: message.content
        });
      }
    });
  }
};

router.post('/upload', protect, messageUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'File is required' });
    }

    res.json({
      url: `/uploads/${req.file.filename}`,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Search messages within a chat
 */
router.get('/search', protect, async (req, res) => {
  try {
    const { chatId, q = '' } = req.query;
    if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: 'Invalid chatId' });
    }
    if (!q || !q.trim()) {
      return res.json([]);
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    if (!ensureParticipant(chat, req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const regex = new RegExp(escapeRegex(q.trim()), 'i');
    const messages = await populateMessage(
      Message.find({
        chat: chatId,
        isDeleted: { $ne: true },
        $or: [
          { content: regex },
          { 'attachments.fileName': regex }
        ]
      })
        .sort({ createdAt: -1 })
        .limit(100)
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Send message (normal or scheduled)
 */
router.post('/', protect, async (req, res) => {
  try {
    const { chatId, content = '', attachments = [], replyTo = null, poll = null, type } = req.body;

    if (!chatId) {
      return res.status(400).json({ message: 'chatId required' });
    }

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: 'Invalid chatId' });
    }

    if ((!content || !content.trim()) && (!attachments || attachments.length === 0) && !poll) {
      return res.status(400).json({ message: 'Message content, attachments, or poll required' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    if (!ensureParticipant(chat, req.user._id)) {
      return res.status(403).json({ message: 'Not a participant of this chat' });
    }

    let group = null;
    let community = null;

    if (chat.group) {
      group = await Group.findById(chat.group);
      if (!group) return res.status(404).json({ message: 'Group not found' });
      if (group.settings?.adminsOnly && !isGroupAdmin(group, req.user._id)) {
        return res.status(403).json({ message: 'Only admins can send messages in this group' });
      }
    }

    if (chat.kind === 'community-announcement' || chat.community) {
      community = await Community.findById(chat.community);
      if (!community) return res.status(404).json({ message: 'Community not found' });
      if (!isCommunityAdmin(community, req.user._id)) {
        return res.status(403).json({ message: 'Only admins can post announcements' });
      }
    }

    if (poll && !chat.isGroup) {
      return res.status(400).json({ message: 'Polls are only available in group chats' });
    }

    let pollPayload = null;
    if (poll) {
      const options = Array.isArray(poll.options) ? poll.options : [];
      if (!poll.question || options.length < 2) {
        return res.status(400).json({ message: 'Poll requires a question and at least 2 options' });
      }
      pollPayload = {
        question: poll.question,
        options: options.map((option) => ({
          option: String(option),
          votes: []
        }))
      };
    }

    const mentionNames = extractMentions(content);
    let mentionUsers = [];
    if (mentionNames.length > 0) {
      mentionUsers = await User.find({ username: { $in: mentionNames } }).select('_id username');
    }

    let allowedMentionIds = mentionUsers.map((u) => u._id);
    if (group) {
      allowedMentionIds = allowedMentionIds.filter((id) => (group.members || []).some((m) => toId(m) === toId(id)));
    } else if (community) {
      allowedMentionIds = allowedMentionIds.filter((id) => (community.members || []).some((m) => toId(m) === toId(id)));
    } else {
      allowedMentionIds = allowedMentionIds.filter((id) => ensureParticipant(chat, id));
    }

    const normalizedAttachments = Array.isArray(attachments) ? attachments : [];
    const messageType = buildMessageType(normalizedAttachments, pollPayload, type);

    const message = await Message.create({
      sender: req.user._id,
      chat: chatId,
      content,
      attachments: normalizedAttachments,
      replyTo: replyTo || null,
      poll: pollPayload,
      type: messageType,
      delivered: true,
      status: 'delivered',
      readBy: [req.user._id],
      mentions: allowedMentionIds
    });

    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: message._id
    });

    const populatedMessage = await populateMessage(Message.findById(message._id));

    await emitNotifications({
      req,
      chat,
      message: populatedMessage,
      mentionIds: allowedMentionIds,
      community
    });

    res.status(201).json(populatedMessage);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Schedule a message (one-time or recurring)
 */
router.post('/schedule', protect, async (req, res) => {
  try {
    const {
      chatId,
      content,
      scheduledFor,
      scheduleType = 'once',
      customInterval = 1,
      customUnit = 'days',
      endsAt = null
    } = req.body;

    if (!chatId || !content || !scheduledFor) {
      return res.status(400).json({ message: 'chatId, content, and scheduledFor are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: 'Invalid chatId' });
    }

    const validTypes = ['once', 'daily', 'weekly', 'monthly', 'custom'];
    if (!validTypes.includes(scheduleType)) {
      return res.status(400).json({ message: 'Invalid scheduleType' });
    }

    if (scheduleType === 'custom') {
      const intervalNum = Number(customInterval);
      if (!Number.isFinite(intervalNum) || intervalNum < 1 || intervalNum > 365) {
        return res.status(400).json({ message: 'customInterval must be between 1 and 365' });
      }
      if (!['days', 'weeks', 'months'].includes(customUnit)) {
        return res.status(400).json({ message: 'customUnit must be days, weeks, or months' });
      }
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    if (!ensureParticipant(chat, req.user._id)) {
      return res.status(403).json({ message: 'Not a participant of this chat' });
    }

    if (chat.group) {
      const group = await Group.findById(chat.group);
      if (group?.settings?.adminsOnly && !isGroupAdmin(group, req.user._id)) {
        return res.status(403).json({ message: 'Only admins can schedule messages in this group' });
      }
    }

    if (chat.kind === 'community-announcement' || chat.community) {
      const community = await Community.findById(chat.community);
      if (community && !isCommunityAdmin(community, req.user._id)) {
        return res.status(403).json({ message: 'Only admins can schedule announcements' });
      }
    }

    const scheduledDate = new Date(scheduledFor);
    if (Number.isNaN(scheduledDate.getTime())) {
      return res.status(400).json({ message: 'Invalid scheduledFor date' });
    }
    if (scheduledDate.getTime() < Date.now() - 60000) {
      return res.status(400).json({ message: 'scheduledFor must be in the future' });
    }

    let endsAtDate = null;
    if (endsAt) {
      endsAtDate = new Date(endsAt);
      if (Number.isNaN(endsAtDate.getTime())) {
        return res.status(400).json({ message: 'Invalid endsAt date' });
      }
      if (endsAtDate.getTime() < scheduledDate.getTime()) {
        return res.status(400).json({ message: 'endsAt must be after scheduledFor' });
      }
    }

    const schedule = await ScheduledMessage.create({
      sender: req.user._id,
      chat: chatId,
      content,
      scheduleType,
      scheduledFor: scheduledDate,
      customInterval: scheduleType === 'custom' ? Number(customInterval) : 1,
      customUnit: scheduleType === 'custom' ? customUnit : 'days',
      endsAt: endsAtDate,
      active: true
    });

    res.status(201).json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Get scheduled messages for a chat
 */
router.get('/schedule/:chatId', protect, async (req, res) => {
  try {
    const { chatId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(chatId)) {
      return res.status(400).json({ message: 'Invalid chatId' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    if (!ensureParticipant(chat, req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const schedules = await ScheduledMessage.find({
      chat: chatId,
      active: true
    })
      .sort({ scheduledFor: 1 })
      .populate('sender', 'name username');

    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Cancel a scheduled message
 */
router.delete('/schedule/:scheduleId', protect, async (req, res) => {
  try {
    const { scheduleId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(scheduleId)) {
      return res.status(400).json({ message: 'Invalid scheduleId' });
    }

    const schedule = await ScheduledMessage.findById(scheduleId);
    if (!schedule) {
      return res.status(404).json({ message: 'Scheduled message not found' });
    }

    const chat = await Chat.findById(schedule.chat);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    const isOwner = schedule.sender.toString() === req.user._id.toString();
    const isAdmin = chat.admin && chat.admin.toString() === req.user._id.toString();
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to cancel this schedule' });
    }

    schedule.active = false;
    await schedule.save();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Toggle a reaction on a message
 */
router.post('/:messageId/reactions', protect, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: 'Invalid messageId' });
    }
    if (!emoji || typeof emoji !== 'string') {
      return res.status(400).json({ message: 'emoji is required' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const chat = await Chat.findById(message.chat);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    if (!ensureParticipant(chat, req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const userId = req.user._id.toString();
    const existing = message.reactions.find((reaction) => reaction.emoji === emoji);

    if (existing) {
      const idx = (existing.users || []).findIndex((id) => id.toString() === userId);
      if (idx >= 0) {
        existing.users.splice(idx, 1);
      } else {
        existing.users.push(req.user._id);
      }

      if (existing.users.length === 0) {
        message.reactions = message.reactions.filter((reaction) => reaction.emoji !== emoji);
      }
    } else {
      message.reactions.push({ emoji, users: [req.user._id] });
    }

    await message.save();

    res.json({ messageId: message._id, reactions: message.reactions });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Edit a message
 */
router.put('/:messageId', protect, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content = '' } = req.body;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: 'Invalid messageId' });
    }
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Content is required' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    if (message.isDeleted) {
      return res.status(400).json({ message: 'Message has been deleted' });
    }

    if (toId(message.sender) !== toId(req.user._id)) {
      return res.status(403).json({ message: 'Only sender can edit message' });
    }

    message.content = content;
    message.editedAt = new Date();
    message.editedBy = req.user._id;
    await message.save();

    const populated = await populateMessage(Message.findById(message._id));
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Delete a message (sender or admin)
 */
router.delete('/:messageId', protect, async (req, res) => {
  try {
    const { messageId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: 'Invalid messageId' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const chat = await Chat.findById(message.chat);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    let allowDelete = toId(message.sender) === toId(req.user._id);

    if (!allowDelete && chat.group) {
      const group = await Group.findById(chat.group);
      if (group && isGroupAdmin(group, req.user._id)) {
        allowDelete = true;
      }
    }

    if (!allowDelete && chat.community) {
      const community = await Community.findById(chat.community);
      if (community && isCommunityAdmin(community, req.user._id)) {
        allowDelete = true;
      }
    }

    if (!allowDelete) {
      return res.status(403).json({ message: 'Not authorized to delete message' });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    message.deletedBy = req.user._id;
    message.content = '';
    message.attachments = [];
    message.poll = null;
    await message.save();

    if (chat.group) {
      await Group.findByIdAndUpdate(chat.group, {
        $pull: { pinnedMessages: message._id }
      });
    }

    res.json({ success: true, messageId: message._id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Vote on a poll
 */
router.post('/:messageId/poll/vote', protect, async (req, res) => {
  try {
    const { messageId } = req.params;
    const { optionIndex } = req.body;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({ message: 'Invalid messageId' });
    }

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    if (!message.poll || !Array.isArray(message.poll.options)) {
      return res.status(400).json({ message: 'Message is not a poll' });
    }

    const chat = await Chat.findById(message.chat);
    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }
    if (!ensureParticipant(chat, req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const index = Number(optionIndex);
    if (!Number.isInteger(index) || index < 0 || index >= message.poll.options.length) {
      return res.status(400).json({ message: 'Invalid poll option' });
    }

    message.poll.options.forEach((option) => {
      option.votes = (option.votes || []).filter((id) => toId(id) !== toId(req.user._id));
    });
    message.poll.options[index].votes.push(req.user._id);

    await message.save();

    res.json({ messageId: message._id, poll: message.poll });
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

    if (!ensureParticipant(chat, req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const messages = await populateMessage(
      Message.find({
        chat: chatId,
        $or: [
          { scheduledFor: null },
          { scheduledFor: { $lte: new Date() } }
        ]
      }).sort({ createdAt: 1 })
    );

    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

router.put('/:chatId/read', protect, async (req, res) => {
  try {
    const { chatId } = req.params;

    await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: req.user._id },
        readBy: { $ne: req.user._id }
      },
      {
        $push: { readBy: req.user._id },
        $set: { status: 'read' }
      }
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

export default router;
