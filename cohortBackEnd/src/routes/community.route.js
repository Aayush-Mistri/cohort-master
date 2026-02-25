import express from 'express';
import protect from '../middleware/auth-middleware.js';
import Community from '../models/community-model.js';

const router = express.Router();

// GET all communities
router.get('/', protect, async (req, res) => {
    try {
        const communities = await Community.find()
            .populate('members', 'name username')
            .sort({ members: -1 }); // Sort by most members
        res.json(communities);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// CREATE community
router.post('/', protect, async (req, res) => {
    try {
        const { name, description, category, icon } = req.body;

        const exists = await Community.findOne({ name });
        if (exists) {
            return res.status(400).json({ message: 'Community name already taken' });
        }

        const community = await Community.create({
            name,
            description,
            category: category || 'general',
            icon: icon || '👥',
            creator: req.user._id,
            members: [req.user._id] // Creator auto-joins
        });

        res.status(201).json(community);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// JOIN community
router.post('/:id/join', protect, async (req, res) => {
    try {
        const community = await Community.findById(req.params.id);
        if (!community) return res.status(404).json({ message: 'Community not found' });

        if (!community.members.includes(req.user._id)) {
            community.members.push(req.user._id);
            await community.save();
        }
        res.json(community);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// LEAVE community
router.post('/:id/leave', protect, async (req, res) => {
    try {
        const community = await Community.findById(req.params.id);
        if (!community) return res.status(404).json({ message: 'Community not found' });

        community.members = community.members.filter(
            memberId => memberId.toString() !== req.user._id.toString()
        );
        await community.save();
        res.json(community);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
