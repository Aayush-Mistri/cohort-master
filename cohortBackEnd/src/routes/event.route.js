import express from 'express';
import protect from '../middleware/auth-middleware.js';
import Event from '../models/event-model.js';

const router = express.Router();

import User from '../models/user-model.js';
import Community from '../models/community-model.js';
import Group from '../models/group-model.js';
import Chat from '../models/chat-model.js';

// ... (existing imports)

// GET all relevant events
router.get('/', protect, async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Find all users we have an individual chat with (contacts)
        const chats = await Chat.find({
            participants: userId,
            isGroup: false
        }).select('participants');
        
        const contactIds = new Set([userId.toString()]);
        chats.forEach(chat => {
            chat.participants.forEach(p => contactIds.add(p.toString()));
        });

        // 2. Find communities and groups user is in
        const userCommunities = await Community.find({ members: userId }).select('_id');
        const communityIds = userCommunities.map(c => c._id);

        const userGroups = await Group.find({ members: userId }).select('_id');
        const groupIds = userGroups.map(g => g._id);

        const events = await Event.find({
            $or: [
                { creator: { $in: Array.from(contactIds) } }, // Created by contact or self
                { attendees: userId }, // User is attending
                { community: { $in: communityIds } }, // Event is in a joined community
                { group: { $in: groupIds } }, // Event is in a joined group
                { community: null, group: null, creator: { $in: Array.from(contactIds) } } // General event by contact
            ]
        })
            .populate('community', 'name icon coverImage')
            .populate('group', 'name icon coverImage')
            .populate('attendees', 'name username profilePic')
            .populate('creator', 'name username profilePic')
            .sort({ date: 1 }); // Sort by closest date
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// CREATE event
router.post('/', protect, async (req, res) => {
    try {
        const { title, description, date, location, communityId, groupId, coverImage, maxAttendees } = req.body;

        const event = await Event.create({
            title,
            description,
            date,
            location,
            coverImage: coverImage || '',
            maxAttendees: maxAttendees || 0,
            community: communityId || null,
            group: groupId || null,
            creator: req.user._id,
            attendees: [req.user._id] // Creator auto-attends
        });

        res.status(201).json(event);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// RSVP (Join/Leave) event
router.post('/:id/rsvp', protect, async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ message: 'Event not found' });

        const isAttending = event.attendees.includes(req.user._id);

        if (isAttending) {
            // Un-RSVP
            event.attendees = event.attendees.filter(
                id => id.toString() !== req.user._id.toString()
            );
        } else {
            // RSVP
            event.attendees.push(req.user._id);
        }

        await event.save();
        res.json(event);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
