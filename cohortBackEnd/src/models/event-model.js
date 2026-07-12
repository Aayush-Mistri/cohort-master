import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    date: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date
    },
    location: {
        type: String,
        default: 'Online'
    },
    coverImage: {
        type: String,
        default: ''
    },
    maxAttendees: {
        type: Number,
        default: 0 // 0 means unlimited
    },
    community: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community'
    },
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Group'
    },
    creator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    attendees: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isExpired: {
        type: Boolean,
        default: false,
        index: true
    },
    expiredAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

eventSchema.pre('validate', function () {
    if (this.date && !this.endDate) {
        this.endDate = this.date;
    }

    if (this.date && this.endDate && this.endDate < this.date) {
        throw new Error('End date must be after the start date.');
    }

    const effectiveEndDate = this.endDate || this.date;
    if (effectiveEndDate instanceof Date && !Number.isNaN(effectiveEndDate.getTime())) {
        const expired = effectiveEndDate <= new Date();
        this.isExpired = expired;
        this.expiredAt = expired ? (this.expiredAt || new Date()) : null;
    }
});

export default mongoose.model('Event', eventSchema);
