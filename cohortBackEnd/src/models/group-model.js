import mongoose from 'mongoose';

const groupSchema = new mongoose.Schema({
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
    coverImage: {
        type: String,
        default: ''
    },
    profileImage: {
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
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Chat',
        default: null
    },
    community: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community',
        default: null
    },
    inviteCode: {
        type: String,
        unique: true,
        sparse: true
    },
    joinRequests: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    settings: {
        adminsOnly: { type: Boolean, default: false },
        requireApproval: { type: Boolean, default: false }
    },
    pinnedMessages: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }]
}, { timestamps: true });

export default mongoose.model('Group', groupSchema);
