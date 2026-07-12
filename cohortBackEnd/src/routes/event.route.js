import express from 'express';
import mongoose from 'mongoose';
import protect from '../middleware/auth-middleware.js';
import Event from '../models/event-model.js';
import User from '../models/user-model.js';
import Community from '../models/community-model.js';
import Group from '../models/group-model.js';
import { emitToUserRooms, getDistinctIds, toId } from '../utils/realtime.js';

const router = express.Router();

const getExpiredEventFilter = (now = new Date()) => ({
    isExpired: { $ne: true },
    $or: [
        { endDate: { $lte: now } },
        { endDate: null, date: { $lte: now } },
        { endDate: { $exists: false }, date: { $lte: now } }
    ]
});

const markExpiredEvents = async (now = new Date()) => {
    await Event.updateMany(
        getExpiredEventFilter(now),
        {
            $set: {
                isExpired: true,
                expiredAt: now
            }
        }
    );
};

const populateEvent = (query) => (
    query
        .populate('community', 'name icon coverImage')
        .populate('group', 'name icon coverImage')
        .populate('attendees', 'name username profilePic bio whoAmI aboutInfo education interests')
        .populate('creator', 'name username profilePic bio whoAmI aboutInfo education interests')
);

const getEventAudienceIds = async (eventDoc) => {
    const audienceIds = new Set([
        toId(eventDoc.creator),
        ...((eventDoc.attendees || []).map((attendeeId) => toId(attendeeId)))
    ]);

    if (eventDoc.community) {
        const community = await Community.findById(eventDoc.community).select('members');
        (community?.members || []).forEach((memberId) => audienceIds.add(toId(memberId)));
        return getDistinctIds(Array.from(audienceIds));
    }

    if (eventDoc.group) {
        const group = await Group.findById(eventDoc.group).select('members');
        (group?.members || []).forEach((memberId) => audienceIds.add(toId(memberId)));
        return getDistinctIds(Array.from(audienceIds));
    }

    const creator = await User.findById(eventDoc.creator).select('friends');
    (creator?.friends || []).forEach((friendId) => audienceIds.add(toId(friendId)));
    return getDistinctIds(Array.from(audienceIds));
};

const parseEventDates = ({ date, endDate }) => {
    const startDate = new Date(date);
    if (Number.isNaN(startDate.getTime())) {
        return { error: 'Please provide a valid event date.' };
    }

    const resolvedEndDate = endDate ? new Date(endDate) : new Date(startDate);
    if (Number.isNaN(resolvedEndDate.getTime())) {
        return { error: 'Please provide a valid event end date.' };
    }

    if (resolvedEndDate < startDate) {
        return { error: 'End date must be after the start date.' };
    }

    const minStartDate = new Date();
    minStartDate.setSeconds(0, 0);
    if (startDate < minStartDate) {
        return { error: 'Past events cannot be created.' };
    }

    return { startDate, resolvedEndDate };
};

const getRouteErrorMessage = (error) => (
    error?.message
    || Object.values(error?.errors || {})[0]?.message
    || 'Unexpected server error'
);

const validateContextId = (value, label) => {
    if (!value) return null;
    if (!mongoose.isValidObjectId(value)) {
        return `${label} is invalid.`;
    }
    return null;
};

// GET all relevant events
router.get('/', protect, async (req, res) => {
    try {
        const userId = req.user._id;
        const now = new Date();
        await markExpiredEvents(now);

        const currentUser = await User.findById(userId).select('friends');
        const contactIds = getDistinctIds([
            userId,
            ...((currentUser?.friends || []).map((friendId) => friendId))
        ]);

        const userCommunities = await Community.find({ members: userId }).select('_id');
        const communityIds = userCommunities.map((community) => community._id);

        const userGroups = await Group.find({ members: userId }).select('_id');
        const groupIds = userGroups.map((group) => group._id);

        const events = await populateEvent(
            Event.find({
                $or: [
                    { creator: { $in: contactIds } },
                    { attendees: userId },
                    { community: { $in: communityIds } },
                    { group: { $in: groupIds } }
                ]
            }).sort({ isExpired: 1, date: 1, createdAt: -1 })
        );

        res.json(events);
    } catch (error) {
        console.error('Failed to load events:', error);
        res.status(500).json({ message: 'Server error', error: getRouteErrorMessage(error) });
    }
});

// CREATE event
router.post('/', protect, async (req, res) => {
    try {
        const {
            title,
            description = '',
            date,
            endDate,
            location = 'Online',
            communityId,
            groupId,
            coverImage = '',
            maxAttendees = 0
        } = req.body;

        const trimmedTitle = String(title || '').trim();
        if (!trimmedTitle) {
            return res.status(400).json({ message: 'Event title is required.' });
        }

        if (communityId && groupId) {
            return res.status(400).json({ message: 'Choose either a community or a group for this event, not both.' });
        }

        const communityIdError = validateContextId(communityId, 'Community');
        if (communityIdError) {
            return res.status(400).json({ message: communityIdError });
        }

        const groupIdError = validateContextId(groupId, 'Group');
        if (groupIdError) {
            return res.status(400).json({ message: groupIdError });
        }

        const { startDate, resolvedEndDate, error } = parseEventDates({ date, endDate });
        if (error) {
            return res.status(400).json({ message: error });
        }

        const maxAttendeesNumber = Number(maxAttendees || 0);
        if (!Number.isFinite(maxAttendeesNumber) || maxAttendeesNumber < 0) {
            return res.status(400).json({ message: 'Max attendees must be 0 or a positive number.' });
        }

        if (communityId) {
            const community = await Community.findOne({ _id: communityId, members: req.user._id }).select('_id');
            if (!community) {
                return res.status(403).json({ message: 'You can only create community events in communities you joined.' });
            }
        }

        if (groupId) {
            const group = await Group.findOne({ _id: groupId, members: req.user._id }).select('_id');
            if (!group) {
                return res.status(403).json({ message: 'You can only create group events in groups you joined.' });
            }
        }

        const event = await Event.create({
            title: trimmedTitle,
            description: String(description || '').trim(),
            date: startDate,
            endDate: resolvedEndDate,
            location: String(location || 'Online').trim() || 'Online',
            coverImage: String(coverImage || '').trim(),
            maxAttendees: maxAttendeesNumber > 0 ? maxAttendeesNumber : 0,
            community: communityId || null,
            group: groupId || null,
            creator: req.user._id,
            attendees: [req.user._id],
            isExpired: false,
            expiredAt: null
        });

        let populatedEvent = event;
        try {
            populatedEvent = await populateEvent(Event.findById(event._id));
        } catch (populateError) {
            console.error(`Failed to populate created event ${event._id}:`, populateError);
        }

        try {
            const audienceIds = await getEventAudienceIds(event);
            emitToUserRooms({
                req,
                userIds: audienceIds,
                payload: {
                    resource: 'events',
                    eventId: event._id.toString(),
                    action: 'created'
                }
            });
        } catch (broadcastError) {
            console.error(`Failed to broadcast created event ${event._id}:`, broadcastError);
        }

        res.status(201).json(populatedEvent || event);
    } catch (error) {
        console.error('Failed to create event:', error);
        res.status(500).json({ message: 'Server error', error: getRouteErrorMessage(error) });
    }
});

// RSVP (Join/Leave) event
router.post('/:id/rsvp', protect, async (req, res) => {
    try {
        await markExpiredEvents(new Date());

        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const effectiveEndDate = event.endDate || event.date;
        if (event.isExpired || (effectiveEndDate && effectiveEndDate <= new Date())) {
            if (!event.isExpired) {
                event.isExpired = true;
                event.expiredAt = new Date();
                await event.save();
            }
            return res.status(400).json({ message: 'This event has already ended.' });
        }

        if (event.community) {
            const community = await Community.findOne({ _id: event.community, members: req.user._id }).select('_id');
            if (!community) {
                return res.status(403).json({ message: 'Only community members can RSVP to this event.' });
            }
        }

        if (event.group) {
            const group = await Group.findOne({ _id: event.group, members: req.user._id }).select('_id');
            if (!group) {
                return res.status(403).json({ message: 'Only group members can RSVP to this event.' });
            }
        }

        const isAttending = (event.attendees || []).some(
            (id) => toId(id) === toId(req.user._id)
        );

        if (isAttending) {
            event.attendees = event.attendees.filter(
                (id) => toId(id) !== toId(req.user._id)
            );
        } else {
            if (event.maxAttendees > 0 && (event.attendees || []).length >= event.maxAttendees) {
                return res.status(400).json({ message: 'This event is already full.' });
            }
            event.attendees.push(req.user._id);
        }

        await event.save();

        let populatedEvent = event;
        try {
            populatedEvent = await populateEvent(Event.findById(event._id));
        } catch (populateError) {
            console.error(`Failed to populate RSVP event ${event._id}:`, populateError);
        }

        try {
            const audienceIds = await getEventAudienceIds(event);
            emitToUserRooms({
                req,
                userIds: audienceIds,
                payload: {
                    resource: 'events',
                    eventId: event._id.toString(),
                    action: 'rsvp'
                }
            });
        } catch (broadcastError) {
            console.error(`Failed to broadcast RSVP for event ${event._id}:`, broadcastError);
        }

        res.json(populatedEvent || event);
    } catch (error) {
        console.error('Failed to RSVP to event:', error);
        res.status(500).json({ message: 'Server error', error: getRouteErrorMessage(error) });
    }
});

export default router;
