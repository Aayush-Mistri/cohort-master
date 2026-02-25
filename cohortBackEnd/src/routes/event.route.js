import express from 'express';
import protect from '../middleware/auth-middleware.js';
import Event from '../models/event-model.js';

const router = express.Router();

// GET all events
router.get('/', protect, async (req, res) => {
    try {
        const events = await Event.find()
            .populate('community', 'name icon')
            .populate('attendees', 'name username')
            .sort({ date: 1 }); // Sort by closest date
        res.json(events);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// CREATE event
router.post('/', protect, async (req, res) => {
    try {
        const { title, description, date, location, communityId } = req.body;

        const event = await Event.create({
            title,
            description,
            date,
            location,
            community: communityId || null,
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
