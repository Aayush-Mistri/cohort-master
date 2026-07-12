import express from 'express';
import mongoose from 'mongoose';
import crypto from 'crypto';
import protect from '../middleware/auth-middleware.js';
import Community from '../models/community-model.js';
import Group from '../models/group-model.js';
import Chat from '../models/chat-model.js';
import Message from '../models/message-model.js';

const router = express.Router();

const toId = (value) => {
    if (!value) return '';
    if (typeof value === 'string') return value;
    if (typeof value?.toHexString === 'function') return value.toHexString();
    if (typeof value === 'object') {
        if (value._id && value._id !== value) return toId(value._id);
        if (value.id) return String(value.id);
    }
    return String(value);
};

const generateInviteCode = () => crypto.randomBytes(6).toString('hex');

const ensureUniqueInviteCode = async () => {
    for (let i = 0; i < 6; i += 1) {
        const code = generateInviteCode();
        const exists = await Community.findOne({ inviteCode: code }).select('_id');
        if (!exists) return code;
    }
    return `${generateInviteCode()}-${Date.now().toString(36)}`;
};

const isCommunityAdmin = (community, userId) => {
    if (!community) return false;
    const id = toId(userId);
    if (toId(community.creator) === id) return true;
    return (community.admins || []).some((adminId) => toId(adminId) === id);
};

const isCommunityMember = (community, userId) => {
    const id = toId(userId);
    return (community.members || []).some((memberId) => toId(memberId) === id);
};

const buildRelevantCommunityQuery = (userId) => ({
    $or: [
        { creator: userId },
        { admins: userId },
        { members: userId },
        { joinRequests: userId }
    ]
});

const canAccessCommunity = (community, userId) => {
    if (!community) return false;
    return (
        isCommunityMember(community, userId)
        || isCommunityAdmin(community, userId)
        || (community.joinRequests || []).some((id) => toId(id) === toId(userId))
    );
};

const populateCommunityList = (query) => (
    query
        .populate('members', 'name username profilePic')
        .populate('admins', 'name username profilePic')
        .populate('creator', 'name username profilePic')
);

const populateCommunityDetail = (query) => (
    query
        .populate('members', 'name username profilePic')
        .populate('admins', 'name username profilePic')
        .populate('creator', 'name username profilePic')
        .populate('joinRequests', 'name username profilePic')
        .populate({
            path: 'groups',
            populate: {
                path: 'members',
                select: 'name username profilePic'
            }
        })
        .populate({
            path: 'announcementChat',
            populate: {
                path: 'participants',
                select: 'name username profilePic'
            }
        })
);

const ensureAnnouncementChat = async (community) => {
    if (community.announcementChat) return community.announcementChat;
    const chat = await Chat.create({
        name: `${community.name} Announcements`,
        isGroup: true,
        kind: 'community-announcement',
        participants: community.members || [],
        admin: community.creator,
        community: community._id
    });
    community.announcementChat = chat._id;
    await community.save();
    return chat._id;
};

const ensureAdminSeed = async (community) => {
    if (community.admins && community.admins.length > 0) return;
    community.admins = [community.creator];
    await community.save();
};

// GET all communities
router.get('/', protect, async (req, res) => {
    try {
        const relevantQuery = buildRelevantCommunityQuery(req.user._id);
        const communities = await populateCommunityList(
            Community.find(relevantQuery).sort({ members: -1 })
        );

        const userId = toId(req.user._id);
        const enriched = communities.map((community) => {
            const isMember = isCommunityMember(community, userId);
            const isAdmin = isCommunityAdmin(community, userId);
            const payload = {
                ...community.toObject(),
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

// GET community details by ID
router.get('/:id', protect, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid community id' });
        }

        const community = await populateCommunityDetail(Community.findById(req.params.id));
        if (!community) return res.status(404).json({ message: 'Community not found' });

        if (!canAccessCommunity(community, req.user._id)) {
            return res.status(403).json({ message: 'Community is only visible in your relevant spaces.' });
        }

        await ensureAdminSeed(community);
        await ensureAnnouncementChat(community);

        const userId = toId(req.user._id);
        const isMember = isCommunityMember(community, userId);
        const isAdmin = isCommunityAdmin(community, userId);

        const payload = {
            ...community.toObject(),
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

// CREATE community
router.post('/', protect, async (req, res) => {
    try {
        const { name, description = '', category = 'general', icon = 'ðŸ‘¥', coverImage = '', rules = '' } = req.body;

        if (!name || typeof name !== 'string') {
            return res.status(400).json({ message: 'Community name is required' });
        }

        const exists = await Community.findOne({ name });
        if (exists) {
            return res.status(400).json({ message: 'Community name already taken' });
        }

        const inviteCode = await ensureUniqueInviteCode();

        const community = await Community.create({
            name,
            description,
            category,
            icon,
            coverImage,
            rules,
            creator: req.user._id,
            admins: [req.user._id],
            members: [req.user._id],
            inviteCode
        });

        const chat = await Chat.create({
            name: `${community.name} Announcements`,
            isGroup: true,
            kind: 'community-announcement',
            participants: [req.user._id],
            admin: req.user._id,
            community: community._id
        });

        community.announcementChat = chat._id;
        await community.save();

        const populated = await populateCommunityDetail(Community.findById(community._id));
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// UPDATE community
router.put('/:id', protect, async (req, res) => {
    try {
        const community = await Community.findById(req.params.id);
        if (!community) return res.status(404).json({ message: 'Community not found' });

        if (!isCommunityAdmin(community, req.user._id)) {
            return res.status(403).json({ message: 'Only admins can update community' });
        }

        const prevName = community.name;
        const { name, description, category, icon, coverImage, rules, settings } = req.body;
        if (name) community.name = name;
        if (description !== undefined) community.description = description;
        if (category !== undefined) community.category = category;
        if (icon !== undefined) community.icon = icon;
        if (coverImage !== undefined) community.coverImage = coverImage;
        if (rules !== undefined) community.rules = rules;
        if (settings) {
            community.settings = { ...community.settings, ...settings };
        }

        await community.save();
        if (name && community.announcementChat && prevName !== community.name) {
            await Chat.findByIdAndUpdate(community.announcementChat, {
                name: `${community.name} Announcements`
            });
        }
        const populated = await populateCommunityDetail(Community.findById(community._id));
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// DELETE community
router.delete('/:id', protect, async (req, res) => {
    try {
        const community = await Community.findById(req.params.id);
        if (!community) return res.status(404).json({ message: 'Community not found' });

        if (!isCommunityAdmin(community, req.user._id)) {
            return res.status(403).json({ message: 'Only admins can delete community' });
        }

        if (community.announcementChat) {
            await Message.deleteMany({ chat: community.announcementChat });
            await Chat.findByIdAndDelete(community.announcementChat);
        }

        await Group.updateMany(
            { community: community._id },
            { $set: { community: null } }
        );

        await community.deleteOne();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// JOIN community
router.post('/:id/join', protect, async (req, res) => {
    try {
        const community = await Community.findById(req.params.id);
        if (!community) return res.status(404).json({ message: 'Community not found' });

        await ensureAnnouncementChat(community);

        if (isCommunityMember(community, req.user._id)) {
            const populated = await populateCommunityDetail(Community.findById(community._id));
            return res.json(populated);
        }

        if (community.settings?.requireApproval) {
            community.joinRequests = community.joinRequests || [];
            if (!community.joinRequests.some((id) => toId(id) === toId(req.user._id))) {
                community.joinRequests.push(req.user._id);
                await community.save();
            }
            return res.json({ pending: true });
        }

        community.members.push(req.user._id);
        await community.save();

        if (community.announcementChat) {
            await Chat.findByIdAndUpdate(community.announcementChat, {
                $addToSet: { participants: req.user._id }
            });
        }

        const populated = await populateCommunityDetail(Community.findById(community._id));
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// JOIN community via invite code
router.post('/invite/:code/join', protect, async (req, res) => {
    try {
        const community = await Community.findOne({ inviteCode: req.params.code });
        if (!community) return res.status(404).json({ message: 'Invite link invalid' });

        await ensureAnnouncementChat(community);

        if (isCommunityMember(community, req.user._id)) {
            const populated = await populateCommunityDetail(Community.findById(community._id));
            return res.json(populated);
        }

        if (community.settings?.requireApproval) {
            community.joinRequests = community.joinRequests || [];
            if (!community.joinRequests.some((id) => toId(id) === toId(req.user._id))) {
                community.joinRequests.push(req.user._id);
                await community.save();
            }
            return res.json({ pending: true });
        }

        community.members.push(req.user._id);
        await community.save();
        if (community.announcementChat) {
            await Chat.findByIdAndUpdate(community.announcementChat, {
                $addToSet: { participants: req.user._id }
            });
        }

        const populated = await populateCommunityDetail(Community.findById(community._id));
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// GET invite code (and optionally refresh)
router.post('/:id/invite', protect, async (req, res) => {
    try {
        const community = await Community.findById(req.params.id);
        if (!community) return res.status(404).json({ message: 'Community not found' });

        if (!isCommunityMember(community, req.user._id)) {
            return res.status(403).json({ message: 'Only members can access invite' });
        }

        const refresh = Boolean(req.body?.refresh);
        if (refresh || !community.inviteCode) {
            community.inviteCode = await ensureUniqueInviteCode();
            await community.save();
        }

        res.json({ inviteCode: community.inviteCode });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// LEAVE community
router.post('/:id/leave', protect, async (req, res) => {
    try {
        const community = await Community.findById(req.params.id);
        if (!community) return res.status(404).json({ message: 'Community not found' });

        if (toId(community.creator) === toId(req.user._id)) {
            return res.status(400).json({ message: 'Creator cannot leave the community' });
        }

        community.members = (community.members || []).filter(
            (memberId) => toId(memberId) !== toId(req.user._id)
        );
        community.admins = (community.admins || []).filter(
            (adminId) => toId(adminId) !== toId(req.user._id)
        );

        await community.save();

        if (community.announcementChat) {
            await Chat.findByIdAndUpdate(community.announcementChat, {
                $pull: { participants: req.user._id }
            });
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// ADD existing group to community
router.post('/:id/groups', protect, async (req, res) => {
    try {
        const { groupId } = req.body;
        const community = await Community.findById(req.params.id);
        if (!community) return res.status(404).json({ message: 'Community not found' });

        if (!isCommunityAdmin(community, req.user._id)) {
            return res.status(403).json({ message: 'Only admins can add groups' });
        }

        if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({ message: 'Valid groupId required' });
        }

        const group = await Group.findById(groupId);
        if (!group) return res.status(404).json({ message: 'Group not found' });

        const isGroupAdmin = toId(group.creator) === toId(req.user._id)
            || (group.admins || []).some((id) => toId(id) === toId(req.user._id));
        if (!isGroupAdmin) {
            return res.status(403).json({ message: 'Only group admins can add this group' });
        }

        group.community = community._id;
        await group.save();

        community.groups = community.groups || [];
        if (!community.groups.some((id) => toId(id) === toId(group._id))) {
            community.groups.push(group._id);
            await community.save();
        }

        const populated = await populateCommunityDetail(Community.findById(community._id));
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// CREATE group inside community
router.post('/:id/groups/create', protect, async (req, res) => {
    try {
        const community = await Community.findById(req.params.id);
        if (!community) return res.status(404).json({ message: 'Community not found' });

        if (!isCommunityAdmin(community, req.user._id)) {
            return res.status(403).json({ message: 'Only admins can create groups here' });
        }

        const { name, description = '', coverImage = '', profileImage = '', icon = 'ðŸ‘¥', members = [] } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Group name is required' });
        }

        const exists = await Group.findOne({ name });
        if (exists) {
            return res.status(400).json({ message: 'Group name already taken' });
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
            community: community._id,
            inviteCode
        });

        chat.group = group._id;
        await chat.save();

        community.groups = community.groups || [];
        community.groups.push(group._id);
        await community.save();

        const populated = await populateCommunityDetail(Community.findById(community._id));
        res.status(201).json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// PROMOTE admin
router.post('/:id/admins/promote', protect, async (req, res) => {
    try {
        const { memberId } = req.body;
        const community = await Community.findById(req.params.id);
        if (!community) return res.status(404).json({ message: 'Community not found' });

        if (!isCommunityAdmin(community, req.user._id)) {
            return res.status(403).json({ message: 'Only admins can promote' });
        }

        if (!memberId || !isCommunityMember(community, memberId)) {
            return res.status(400).json({ message: 'Member not found in community' });
        }

        community.admins = community.admins || [];
        if (!community.admins.some((id) => toId(id) === toId(memberId))) {
            community.admins.push(memberId);
            await community.save();
        }

        const populated = await populateCommunityDetail(Community.findById(community._id));
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// DEMOTE admin
router.post('/:id/admins/demote', protect, async (req, res) => {
    try {
        const { memberId } = req.body;
        const community = await Community.findById(req.params.id);
        if (!community) return res.status(404).json({ message: 'Community not found' });

        if (!isCommunityAdmin(community, req.user._id)) {
            return res.status(403).json({ message: 'Only admins can demote' });
        }

        if (toId(memberId) === toId(community.creator)) {
            return res.status(400).json({ message: 'Cannot demote the creator' });
        }

        community.admins = (community.admins || []).filter((id) => toId(id) !== toId(memberId));
        await community.save();

        const populated = await populateCommunityDetail(Community.findById(community._id));
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// JOIN REQUEST approve
router.post('/:id/join-requests/:userId/approve', protect, async (req, res) => {
    try {
        const community = await Community.findById(req.params.id);
        if (!community) return res.status(404).json({ message: 'Community not found' });

        if (!isCommunityAdmin(community, req.user._id)) {
            return res.status(403).json({ message: 'Only admins can approve' });
        }

        const userId = req.params.userId;
        community.joinRequests = (community.joinRequests || []).filter(
            (id) => toId(id) !== toId(userId)
        );
        if (!isCommunityMember(community, userId)) {
            community.members.push(userId);
        }

        await community.save();

        if (community.announcementChat) {
            await Chat.findByIdAndUpdate(community.announcementChat, {
                $addToSet: { participants: userId }
            });
        }

        const populated = await populateCommunityDetail(Community.findById(community._id));
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// JOIN REQUEST reject
router.post('/:id/join-requests/:userId/reject', protect, async (req, res) => {
    try {
        const community = await Community.findById(req.params.id);
        if (!community) return res.status(404).json({ message: 'Community not found' });

        if (!isCommunityAdmin(community, req.user._id)) {
            return res.status(403).json({ message: 'Only admins can reject' });
        }

        const userId = req.params.userId;
        community.joinRequests = (community.joinRequests || []).filter(
            (id) => toId(id) !== toId(userId)
        );
        await community.save();

        const populated = await populateCommunityDetail(Community.findById(community._id));
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// UPDATE community settings
router.post('/:id/settings', protect, async (req, res) => {
    try {
        const community = await Community.findById(req.params.id);
        if (!community) return res.status(404).json({ message: 'Community not found' });

        if (!isCommunityAdmin(community, req.user._id)) {
            return res.status(403).json({ message: 'Only admins can change settings' });
        }

        const { requireApproval } = req.body;
        community.settings = {
            ...community.settings,
            requireApproval: typeof requireApproval === 'boolean' ? requireApproval : community.settings?.requireApproval
        };

        await community.save();
        const populated = await populateCommunityDetail(Community.findById(community._id));
        res.json(populated);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
