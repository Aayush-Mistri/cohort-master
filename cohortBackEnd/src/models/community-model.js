import mongoose from 'mongoose';

const communitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    description: {
        type: String,
        default: ''
    },
    category: {
        type: String,
        default: 'general'
    },
    coverImage: {
        type: String,
        default: ''
    },
    rules: {
        type: String,
        default: ''
    },
    icon: {
        type: String,
        default: 'ðŸ‘¥'
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    admins: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    groups: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    }],
    inviteCode: {
        type: String,
        unique: true,
        sparse: true
    },
    announcementChat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        default: null
    },
    joinRequests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    settings: {
        requireApproval: { type: Boolean, default: false }
    }
}, { timestamps: true });

export default mongoose.model('Community', communitySchema);
