import mongoose from 'mongoose';

const updateSchema = new mongoose.Schema({
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        default: ''
    },
    image: {
        type: String,
        default: ''
    },
    visibility: {
        type: String,
        enum: ['public', 'contacts', 'community', 'group'],
        default: 'contacts'
    },
    community: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community'
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    },
    expiresAt: {
        type: Date,
        default: () => new Date(+new Date() + 24 * 60 * 60 * 1000) // 24 hours from now
    }
}, { timestamps: true });

// Auto-delete expired updates
updateSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('Update', updateSchema);
