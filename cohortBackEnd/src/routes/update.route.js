import express from 'express';
import protect from '../middleware/auth-middleware.js';
import Update from '../models/update-model.js';
import upload from '../middleware/upload-middleware.js';
import { emitToUserRooms, getDistinctIds, toId } from '../utils/realtime.js';
import { saveUploadAsMedia } from '../utils/media.js';

const router = express.Router();

import User from '../models/user-model.js';
import Community from '../models/community-model.js';
import Group from '../models/group-model.js';

// ... (existing imports and getAuthHeader)

const getUpdateAudienceIds = async ({ authorId, visibility, communityId, groupId, req }) => {
    if (visibility === 'public') {
        const io = req.app.get('io');
        if (io) {
            io.emit('app-refresh', { resource: 'updates', visibility: 'public' });
        }
        return [];
    }

    if (visibility === 'community' && communityId) {
        const community = await Community.findById(communityId).select('members');
        return getDistinctIds([authorId, ...((community?.members || []).map((memberId) => toId(memberId)))]);
    }

    if (visibility === 'group' && groupId) {
        const group = await Group.findById(groupId).select('members');
        return getDistinctIds([authorId, ...((group?.members || []).map((memberId) => toId(memberId)))]);
    }

    const author = await User.findById(authorId).select('friends');
    return getDistinctIds([authorId, ...((author?.friends || []).map((friendId) => toId(friendId)))]);
};

// GET all active updates
router.get('/', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const currentUser = await User.findById(userId).select('friends');
        const contactIds = new Set([
            userId.toString(),
            ...((currentUser?.friends || []).map((friendId) => friendId.toString()))
        ]);

        const userCommunities = await Community.find({ members: userId }).select('_id');
        const communityIds = userCommunities.map(c => c._id);

        const userGroups = await Group.find({ members: userId }).select('_id');
        const groupIds = userGroups.map(g => g._id);

        const updates = await Update.find({
            expiresAt: { $gt: new Date() },
            $or: [
                { author: { $in: Array.from(contactIds) }, visibility: 'contacts' },
                { visibility: 'public' },
                { community: { $in: communityIds }, visibility: 'community' },
                { group: { $in: groupIds }, visibility: 'group' },
                { author: userId }
            ]
        })
            .populate('author', 'name username profilePic bio whoAmI aboutInfo education interests')
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
        const resolvedVisibility = visibility || 'contacts';

        // Require either text or image
        if (!content && !req.file) {
            return res.status(400).json({ message: 'Content or image required' });
        }

        if (resolvedVisibility === 'community') {
            if (!communityId) {
                return res.status(400).json({ message: 'communityId is required for community updates' });
            }
            const community = await Community.findOne({ _id: communityId, members: req.user._id }).select('_id');
            if (!community) {
                return res.status(403).json({ message: 'You can only post community updates in communities you joined' });
            }
        }

        if (resolvedVisibility === 'group') {
            if (!groupId) {
                return res.status(400).json({ message: 'groupId is required for group updates' });
            }
            const group = await Group.findOne({ _id: groupId, members: req.user._id }).select('_id');
            if (!group) {
                return res.status(403).json({ message: 'You can only post group updates in groups you joined' });
            }
        }

        const storedImage = req.file
            ? await saveUploadAsMedia({
                file: req.file,
                ownerId: req.user._id,
                category: 'updates'
            })
            : null;

        const update = await Update.create({
            author: req.user._id,
            content,
            visibility: resolvedVisibility,
            community: communityId || null,
            group: groupId || null,
            image: storedImage?.url || ''
        });

        const populatedUpdate = await update.populate('author', 'name username profilePic bio whoAmI aboutInfo education interests');

        const audienceIds = await getUpdateAudienceIds({
            authorId: req.user._id,
            visibility: resolvedVisibility,
            communityId,
            groupId,
            req
        });

        if (audienceIds.length > 0) {
            emitToUserRooms({
                req,
                userIds: audienceIds,
                payload: {
                    resource: 'updates',
                    updateId: update._id.toString(),
                    action: 'created'
                }
            });
        }

        res.status(201).json(populatedUpdate);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
