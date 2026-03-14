import express from 'express';
import protect from '../middleware/auth-middleware.js';
import Update from '../models/update-model.js';
import upload from '../middleware/upload-middleware.js';

const router = express.Router();

import User from '../models/user-model.js';
import Chat from '../models/chat-model.js';
import Community from '../models/community-model.js';
import Group from '../models/group-model.js';

// ... (existing imports and getAuthHeader)

// GET all active updates
router.get('/', protect, async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Find all users we have an individual chat with
        const chats = await Chat.find({
            participants: userId
        }).select('participants');
        
        const contactIds = new Set([userId.toString()]);
        chats.forEach(chat => {
            chat.participants.forEach(p => contactIds.add(p.toString()));
        });

        // 2. Find communities and groups user is in (and their members)
        const userCommunities = await Community.find({ members: userId }).select('_id members');
        const communityIds = userCommunities.map(c => c._id);
        userCommunities.forEach(community => {
            (community.members || []).forEach(memberId => contactIds.add(memberId.toString()));
        });

        const userGroups = await Group.find({ members: userId }).select('_id members');
        const groupIds = userGroups.map(g => g._id);
        userGroups.forEach(group => {
            (group.members || []).forEach(memberId => contactIds.add(memberId.toString()));
        });

        const updates = await Update.find({
            expiresAt: { $gt: new Date() },
            $or: [
                { author: { $in: Array.from(contactIds) }, visibility: 'contacts' }, // Update from a contact
                { visibility: 'public' }, // Public updates
                { community: { $in: communityIds }, visibility: 'community' }, // In a joined community
                { group: { $in: groupIds }, visibility: 'group' }, // In a joined group
                { author: userId } // My own updates
            ]
        })
            .populate('author', 'name username profilePic')
            .populate('community', 'name icon')
            .populate('group', 'name icon')
            .sort({ createdAt: -1 });

        res.json(updates);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// CREATE update
router.post('/', protect, upload.single('image'), async (req, res) => {
    try {
        const { content, visibility, communityId, groupId } = req.body;

        // Require either text or image
        if (!content && !req.file) {
            return res.status(400).json({ message: 'Content or image required' });
        }

        const update = await Update.create({
            author: req.user._id,
            content,
            visibility: visibility || 'contacts',
            community: communityId || null,
            group: groupId || null,
            image: req.file ? `/uploads/${req.file.filename}` : ''
        });

        const populatedUpdate = await update.populate('author', 'name username profilePic');

        res.status(201).json(populatedUpdate);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
