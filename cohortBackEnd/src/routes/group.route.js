import express from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import protect from '../middleware/auth-middleware.js';
import Group from '../models/group-model.js';
import Community from '../models/community-model.js';
import Chat from '../models/chat-model.js';
import Message from '../models/message-model.js';
import User from '../models/user-model.js';

const router = express.Router();

const toId = (value) => value?.toString();

const generateInviteCode = () => crypto.randomBytes(6).toString('hex');

const ensureUniqueInviteCode = async () => {
    for (let i = 0; i < 6; i += 1) {
        const code = generateInviteCode();
        const exists = await Group.findOne({ inviteCode: code }).select('_id');
        if (!exists) return code;
    }
    return `${generateInviteCode()}-${Date.now().toString(36)}`;
};

const isGroupAdmin = (group, userId) => {
    const id = toId(userId);
    if (!group) return false;
    if (toId(group.creator) === id) return true;
    return (group.admins || []).some((adminId) => toId(adminId) === id);
};

const isGroupMember = (group, userId) => {
    const id = toId(userId);
    return (group.members || []).some((memberId) => toId(memberId) === id);
};

const ensureGroupChat = async (group) => {
    if (group.chat) return group.chat;
    const chat = await Chat.create({
        name: group.name,
        isGroup: true,
        kind: 'group',
        participants: group.members || [],
        admin: group.creator,
        group: group._id
    });
    group.chat = chat._id;
    await group.save();
    return chat._id;
};

const ensureAdminSeed = async (group) => {
    if (group.admins && group.admins.length > 0) return;
    group.admins = [group.creator];
    await group.save();
};

const populateGroup = (query) => (
    query
        .populate('members', 'name username profilePic')
        .populate('admins', 'name username profilePic')
        .populate('creator', 'name username profilePic')
        .populate('joinRequests', 'name username profilePic')
        .populate({
            path: 'chat',
            populate: {
                path: 'participants',
                select: 'name username profilePic'
            }
        })
        .populate({
            path: 'pinnedMessages',
            populate: {
                path: 'sender',
                select: 'name username profilePic'
            }
        })
);

// GET all groups
router.get('/', protect, async (req, res) => {
    try {
        const groups = await populateGroup(
            Group.find().sort({ members: -1 })
        );

        const userId = toId(req.user._id);
        const enriched = groups.map((group) => {
            const isMember = isGroupMember(group, userId);
            const isAdmin = isGroupAdmin(group, userId);
            const payload = {
                ...group.toObject(),
                isMember,
                role: isAdmin ? 'admin' : isMember ? 'member' : 'guest'
            };
            if (!isMember) {
                delete payload.inviteCode;
            }
            return payload;
        });

        res.json(enriched);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET group details by ID
router.get('/:id', protect, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid group id' });
        }

        const group = await populateGroup(Group.findById(req.params.id));

        if (!group) return res.status(404).json({ message: 'Group not found' });

        await ensureAdminSeed(group);
        await ensureGroupChat(group);

        const userId = toId(req.user._id);
        const isMember = isGroupMember(group, userId);
        const isAdmin = isGroupAdmin(group, userId);

        const payload = {
            ...group.toObject(),
            isMember,
            role: isAdmin ? 'admin' : isMember ? 'member' : 'guest'
        };

        if (!isMember) {
            delete payload.inviteCode;
        }

        res.json(payload);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// CREATE group
router.post('/', protect, async (req, res) => {
    try {
        const {
            name,
            description = '',
            coverImage = '',
            profileImage = '',
            icon = 'ðŸ‘¥',
            members = [],
            communityId = null
        } = req.body;

        if (!name || typeof name !== 'string') {
            return res.status(400).json({ message: 'Group name is required' });
        }

        const exists = await Group.findOne({ name });
        if (exists) {
            return res.status(400).json({ message: 'Group name already taken' });
        }

        let community = null;
        if (communityId) {
            if (!mongoose.Types.ObjectId.isValid(communityId)) {
                return res.status(400).json({ message: 'Invalid community id' });
            }
            community = await Community.findById(communityId);
            if (!community) {
                return res.status(404).json({ message: 'Community not found' });
            }
            const isCommunityAdmin = toId(community.creator) === toId(req.user._id)
                || (community.admins || []).some((id) => toId(id) === toId(req.user._id));
            if (!isCommunityAdmin) {
                return res.status(403).json({ message: 'Only community admins can create groups here' });
            }
        }

        const uniqueUsers = [...new Set((members || []).map((id) => id.toString()))];
        const participants = [toId(req.user._id), ...uniqueUsers].filter(Boolean);

        const chat = await Chat.create({
            name,
            isGroup: true,
            kind: 'group',
            participants,
            admin: req.user._id
        });

        const inviteCode = await ensureUniqueInviteCode();

        const group = await Group.create({
            name,
            description,
            coverImage,
            profileImage,
            icon,
            creator: req.user._id,
            admins: [req.user._id],
            members: participants,
            chat: chat._id,
            community: community ? community._id : null,
            inviteCode
        });

        chat.group = group._id;
        await chat.save();

        if (community) {
            community.groups = community.groups || [];
            if (!community.groups.some((id) => toId(id) === toId(group._id))) {
                community.groups.push(group._id);
                await community.save();
            }
        }

        const populated = await populateGroup(Group.findById(group._id));
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// UPDATE group
router.put('/:id', protect, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        if (!isGroupAdmin(group, req.user._id)) {
            return res.status(403).json({ message: 'Only admins can update group' });
        }

        const prevName = group.name;
        const {
            name,
            description,
            coverImage,
            profileImage,
            icon,
            settings
        } = req.body;

        if (name) group.name = name;
        if (description !== undefined) group.description = description;
        if (coverImage !== undefined) group.coverImage = coverImage;
        if (profileImage !== undefined) group.profileImage = profileImage;
        if (icon !== undefined) group.icon = icon;
        if (settings) {
            group.settings = {
                ...group.settings,
                ...settings
            };
        }

        await group.save();
        if (name && group.chat && prevName !== group.name) {
            await Chat.findByIdAndUpdate(group.chat, { name: group.name });
        }
        const populated = await populateGroup(Group.findById(group._id));
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// DELETE group
router.delete('/:id', protect, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        if (!isGroupAdmin(group, req.user._id)) {
            return res.status(403).json({ message: 'Only admins can delete group' });
        }

        if (group.chat) {
            await Message.deleteMany({ chat: group.chat });
            await Chat.findByIdAndDelete(group.chat);
        }

        if (group.community) {
            await Community.findByIdAndUpdate(group.community, {
                $pull: { groups: group._id }
            });
        }

        await group.deleteOne();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// JOIN group
router.post('/:id/join', protect, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        await ensureGroupChat(group);

        if (isGroupMember(group, req.user._id)) {
            const populated = await populateGroup(Group.findById(group._id));
            return res.json(populated);
        }

        if (group.settings?.requireApproval) {
            group.joinRequests = group.joinRequests || [];
            if (!group.joinRequests.some((id) => toId(id) === toId(req.user._id))) {
                group.joinRequests.push(req.user._id);
                await group.save();
            }
            return res.json({ pending: true });
        }

        group.members.push(req.user._id);
        await group.save();

        if (group.chat) {
            await Chat.findByIdAndUpdate(group.chat, {
                $addToSet: { participants: req.user._id }
            });
        }

        const populated = await populateGroup(Group.findById(group._id));
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// JOIN group via invite code
router.post('/invite/:code/join', protect, async (req, res) => {
    try {
        const group = await Group.findOne({ inviteCode: req.params.code });
        if (!group) return res.status(404).json({ message: 'Invite link invalid' });

        await ensureGroupChat(group);

        if (isGroupMember(group, req.user._id)) {
            const populated = await populateGroup(Group.findById(group._id));
            return res.json(populated);
        }

        if (group.settings?.requireApproval) {
            group.joinRequests = group.joinRequests || [];
            if (!group.joinRequests.some((id) => toId(id) === toId(req.user._id))) {
                group.joinRequests.push(req.user._id);
                await group.save();
            }
            return res.json({ pending: true });
        }

        group.members.push(req.user._id);
        await group.save();
        if (group.chat) {
            await Chat.findByIdAndUpdate(group.chat, {
                $addToSet: { participants: req.user._id }
            });
        }

        const populated = await populateGroup(Group.findById(group._id));
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET invite code (and optionally refresh)
router.post('/:id/invite', protect, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        if (!isGroupMember(group, req.user._id)) {
            return res.status(403).json({ message: 'Only members can access invite' });
        }

        const refresh = Boolean(req.body?.refresh);
        if (refresh || !group.inviteCode) {
            group.inviteCode = await ensureUniqueInviteCode();
            await group.save();
        }

        res.json({ inviteCode: group.inviteCode });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// LEAVE group
router.post('/:id/leave', protect, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        if (toId(group.creator) === toId(req.user._id)) {
            return res.status(400).json({ message: 'Creator cannot leave the group' });
        }

        group.members = (group.members || []).filter(
            (memberId) => toId(memberId) !== toId(req.user._id)
        );
        group.admins = (group.admins || []).filter(
            (adminId) => toId(adminId) !== toId(req.user._id)
        );

        await group.save();

        if (group.chat) {
            await Chat.findByIdAndUpdate(group.chat, {
                $pull: { participants: req.user._id }
            });
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// ADD members
router.post('/:id/members', protect, async (req, res) => {
    try {
        const { members = [] } = req.body;
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        if (!isGroupAdmin(group, req.user._id)) {
            return res.status(403).json({ message: 'Only admins can add members' });
        }

        const uniqueUsers = [...new Set((members || []).map((id) => id.toString()))];
        const userDocs = await User.find({ _id: { $in: uniqueUsers } }).select('_id');
        const validIds = userDocs.map((u) => u._id.toString());

        group.members = group.members || [];
        validIds.forEach((id) => {
            if (!group.members.some((memberId) => toId(memberId) === id)) {
                group.members.push(id);
            }
        });

        group.joinRequests = (group.joinRequests || []).filter(
            (id) => !validIds.includes(toId(id))
        );

        await group.save();

        if (group.chat) {
            await Chat.findByIdAndUpdate(group.chat, {
                $addToSet: { participants: { $each: validIds } }
            });
        }

        const populated = await populateGroup(Group.findById(group._id));
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// REMOVE member
router.post('/:id/members/remove', protect, async (req, res) => {
    try {
        const { memberId } = req.body;
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        if (!isGroupAdmin(group, req.user._id)) {
            return res.status(403).json({ message: 'Only admins can remove members' });
        }

        if (!memberId) {
            return res.status(400).json({ message: 'memberId is required' });
        }

        if (toId(memberId) === toId(group.creator)) {
            return res.status(400).json({ message: 'Cannot remove the creator' });
        }

        group.members = (group.members || []).filter((id) => toId(id) !== toId(memberId));
        group.admins = (group.admins || []).filter((id) => toId(id) !== toId(memberId));
        await group.save();

        if (group.chat) {
            await Chat.findByIdAndUpdate(group.chat, {
                $pull: { participants: memberId }
            });
        }

        const populated = await populateGroup(Group.findById(group._id));
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// PROMOTE admin
router.post('/:id/admins/promote', protect, async (req, res) => {
    try {
        const { memberId } = req.body;
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        if (!isGroupAdmin(group, req.user._id)) {
            return res.status(403).json({ message: 'Only admins can promote' });
        }

        if (!memberId || !isGroupMember(group, memberId)) {
            return res.status(400).json({ message: 'Member not found in group' });
        }

        group.admins = group.admins || [];
        if (!group.admins.some((id) => toId(id) === toId(memberId))) {
            group.admins.push(memberId);
            await group.save();
        }

        const populated = await populateGroup(Group.findById(group._id));
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// DEMOTE admin
router.post('/:id/admins/demote', protect, async (req, res) => {
    try {
        const { memberId } = req.body;
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        if (!isGroupAdmin(group, req.user._id)) {
            return res.status(403).json({ message: 'Only admins can demote' });
        }

        if (toId(memberId) === toId(group.creator)) {
            return res.status(400).json({ message: 'Cannot demote the creator' });
        }

        group.admins = (group.admins || []).filter((id) => toId(id) !== toId(memberId));
        await group.save();

        const populated = await populateGroup(Group.findById(group._id));
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// JOIN REQUEST approve
router.post('/:id/join-requests/:userId/approve', protect, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        if (!isGroupAdmin(group, req.user._id)) {
            return res.status(403).json({ message: 'Only admins can approve' });
        }

        const userId = req.params.userId;
        group.joinRequests = (group.joinRequests || []).filter(
            (id) => toId(id) !== toId(userId)
        );
        if (!isGroupMember(group, userId)) {
            group.members.push(userId);
        }

        await group.save();

        if (group.chat) {
            await Chat.findByIdAndUpdate(group.chat, {
                $addToSet: { participants: userId }
            });
        }

        const populated = await populateGroup(Group.findById(group._id));
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// JOIN REQUEST reject
router.post('/:id/join-requests/:userId/reject', protect, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        if (!isGroupAdmin(group, req.user._id)) {
            return res.status(403).json({ message: 'Only admins can reject' });
        }

        const userId = req.params.userId;
        group.joinRequests = (group.joinRequests || []).filter(
            (id) => toId(id) !== toId(userId)
        );
        await group.save();

        const populated = await populateGroup(Group.findById(group._id));
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// UPDATE group settings
router.post('/:id/settings', protect, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        if (!isGroupAdmin(group, req.user._id)) {
            return res.status(403).json({ message: 'Only admins can change settings' });
        }

        const { adminsOnly, requireApproval } = req.body;
        group.settings = {
            ...group.settings,
            adminsOnly: typeof adminsOnly === 'boolean' ? adminsOnly : group.settings?.adminsOnly,
            requireApproval: typeof requireApproval === 'boolean' ? requireApproval : group.settings?.requireApproval
        };

        await group.save();
        const populated = await populateGroup(Group.findById(group._id));
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// PIN/UNPIN message
router.post('/:id/pins', protect, async (req, res) => {
    try {
        const { messageId, action = 'pin' } = req.body;
        if (!messageId) {
            return res.status(400).json({ message: 'messageId is required' });
        }

        const group = await Group.findById(req.params.id);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        if (!isGroupAdmin(group, req.user._id)) {
            return res.status(403).json({ message: 'Only admins can pin messages' });
        }

        if (action === 'unpin') {
            group.pinnedMessages = (group.pinnedMessages || []).filter(
                (id) => toId(id) !== toId(messageId)
            );
        } else {
            group.pinnedMessages = group.pinnedMessages || [];
            if (!group.pinnedMessages.some((id) => toId(id) === toId(messageId))) {
                group.pinnedMessages.push(messageId);
            }
        }

        await group.save();
        const populated = await populateGroup(Group.findById(group._id));
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
