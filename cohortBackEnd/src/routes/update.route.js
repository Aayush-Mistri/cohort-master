import express from 'express';
import protect from '../middleware/auth-middleware.js';
import Update from '../models/update-model.js';
import upload from '../middleware/upload-middleware.js';

const router = express.Router();

// GET all active updates
router.get('/', protect, async (req, res) => {
    try {
        // In a real app, filtering by friends would happen here
        // For now, return all updates from everyone (public feed style)
        const updates = await Update.find({ expiresAt: { $gt: new Date() } })
            .populate('author', 'name username profilePic')
            .sort({ createdAt: -1 });
        res.json(updates);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// CREATE update
router.post('/', protect, upload.single('image'), async (req, res) => {
    try {
        const { content } = req.body;

        // Require either text or image
        if (!content && !req.file) {
            return res.status(400).json({ message: 'Content or image required' });
        }

        const update = await Update.create({
            author: req.user._id,
            content,
            image: req.file ? `/uploads/${req.file.filename}` : ''
        });

        const populatedUpdate = await update.populate('author', 'name username profilePic');

        res.status(201).json(populatedUpdate);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

export default router;
