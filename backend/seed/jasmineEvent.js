const Event = require('../models/Event');

const JASMINE_EVENT = {
  title: 'Jasmine Sandlas — Koshish Festaweek 2026',
  slug: 'jasmine-sandlas-koshish-2026',
  description:
    'Jasmine Sandlas performs at PCTE Festaweek 2026. The supplied event poster lists Ludhiana, October 9, 2026 at 7:00 PM.',
  coverImageUrl: '/covers/jasmine-sandlas-poster.png',
  venue: 'Ludhiana',
  startDate: new Date('2026-10-09T19:00:00+05:30'),
  endDate: new Date('2026-10-09T19:00:00+05:30'),
  status: 'published',
  isPublic: true,
  tags: ['koshish', 'festaweek', 'live music', 'Jasmine Sandlas'],
  socialLinks: {
    facebookUrl: 'https://www.facebook.com/pctegroup/',
    instagramUrl: 'https://www.instagram.com/pcteofficial/?hl=en',
    youtubeChannelUrl: 'https://youtube.com/@pctegroupofinstitutes?si=86Z_q8rap1tIILjK',
    youtubeVideoId: null,
  },
};

async function upsertJasmineEvent({ organization, society, owner }) {
  if (!organization?._id || !society?._id || !owner?._id) {
    throw new Error('PCTE organization, Koshish society, and event owner are required.');
  }

  return Event.findOneAndUpdate(
    { organization: organization._id, slug: JASMINE_EVENT.slug },
    {
      $set: { ...JASMINE_EVENT, society: society._id },
      $setOnInsert: { organization: organization._id, createdBy: owner._id, managers: [owner._id] },
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
}

module.exports = { JASMINE_EVENT, upsertJasmineEvent };
