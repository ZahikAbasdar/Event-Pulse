const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema(
  {
    organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
    society: { type: mongoose.Schema.Types.ObjectId, ref: 'Society', default: null },
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    description: { type: String, default: '' },
    coverImageUrl: { type: String, default: null },
    socialLinks: {
      facebookUrl: { type: String, default: null },
      instagramUrl: { type: String, default: null },
      youtubeChannelUrl: { type: String, default: null },
      youtubeVideoId: { type: String, default: null }, // embedded highlight/live video on the event page
    },
    venue: { type: String, default: '' },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['draft', 'published', 'ongoing', 'completed', 'cancelled'],
      default: 'draft',
    },
    tags: [{ type: String }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    managers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    ticketTypes: [
      {
        name: { type: String, required: true }, // e.g. General, Participant, VIP
        price: { type: Number, default: 0 },
        capacity: { type: Number, default: null }, // null = unlimited
        registered: { type: Number, default: 0 },
      },
    ],
    stats: {
      views: { type: Number, default: 0 },
      registrations: { type: Number, default: 0 },
      checkIns: { type: Number, default: 0 },
    },
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

eventSchema.index({ organization: 1, slug: 1 }, { unique: true });
eventSchema.index({ organization: 1, status: 1, startDate: 1 });
eventSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Event', eventSchema);
