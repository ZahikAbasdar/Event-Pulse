/**
 * Seed script for EventPulse — creates ONLY real structural data:
 * the PCTE organization, the six real PCTE societies, the Koshish 2026
 * event, and your own real admin account. No dummy users, no fake
 * responses, no fake teams/scores/sponsors.
 *
 * Run with: npm run seed  (from backend/)
 */
require('dotenv').config();
const connectDB = require('../config/db');
const Organization = require('../models/Organization');
const User = require('../models/User');
const Society = require('../models/Society');
const Event = require('../models/Event');
const CompetitionEvent = require('../models/CompetitionEvent');
const { upsertJasmineEvent } = require('./jasmineEvent');

function getOwnerAccount() {
  const { OWNER_NAME, OWNER_EMAIL, OWNER_PASSWORD } = process.env;
  const missing = [
    ['OWNER_NAME', OWNER_NAME],
    ['OWNER_EMAIL', OWNER_EMAIL],
    ['OWNER_PASSWORD', OWNER_PASSWORD],
  ].filter(([, value]) => !value);

  if (missing.length) {
    throw new Error(`Missing required seed environment variables: ${missing.map(([name]) => name).join(', ')}`);
  }
  if (OWNER_PASSWORD.length < 8) {
    throw new Error('OWNER_PASSWORD must be at least 8 characters long.');
  }

  return {
    name: OWNER_NAME,
    email: OWNER_EMAIL,
    password: OWNER_PASSWORD,
    role: 'org_admin',
  };
}

async function seed() {
  const ownerAccount = getOwnerAccount();
  await connectDB();
  console.log('[seed] Connected. Clearing existing collections (structure only, no fake data to begin with)...');

  await Promise.all([
    CompetitionEvent.deleteMany({}),
    Event.deleteMany({}),
    Society.deleteMany({}),
    User.deleteMany({}),
    Organization.deleteMany({}),
  ]);

  const org = await Organization.create({
    name: 'PCTE Group of Institutes',
    slug: 'pcte',
    brandColors: { primary: '#7A1F2B', accent: '#C9A227' },
    plan: 'enterprise',
    billingStatus: 'active',
  });
  console.log(`[seed] Organization created: ${org.name}`);

  const owner = await User.create({ ...ownerAccount, organization: org._id });
  console.log(`[seed] Your real account created: ${owner.email} (role: ${owner.role})`);

  const societiesData = [
    { name: 'Debate Society', slug: 'debate-society', tagline: 'Argue. Persuade. Prevail.', colorTheme: '#7A1F2B',
      description: "PCTE's debate society trains students in British Parliamentary and other competitive debate formats, representing the college at inter-university tournaments year-round." },
    { name: 'Koshish', slug: 'koshish', tagline: "Festaweek — PCTE's annual cultural and literary festival", colorTheme: '#7A1F2B',
      description: "Festaweek (Koshish) is PCTE's premier annual cultural and literary festival: an energetic showcase of student creativity, confidence and campus spirit." },
    { name: 'Turf', slug: 'turf', tagline: 'PCTE’s inter-school festival', colorTheme: '#2B5B3E',
      description: "TURF brings school students from across the region together for cultural performances, creative arts, literary competitions, culinary events and stage performances." },
    { name: 'Ehsaas', slug: 'ehsaas', tagline: 'PCTE’s inter-college youth festival', colorTheme: '#1F4E79',
      description: "EHSAAS is PCTE's inter-college festival celebrating student voices, music, dance, literary expression and stage performance in a creative, supportive environment." },
    { name: 'PAC', slug: 'pac', tagline: 'Performing Arts Club', colorTheme: '#7A1F2B',
      description: "PCTE's Performing Arts Club nurtures student talent in dance, music, theatre and stage performance year-round, feeding into fest showcases like Koshish." },
    { name: 'STEM', slug: 'stem', tagline: 'Science, Technology, Engineering & Math society', colorTheme: '#0F6E6E',
      description: "PCTE's STEM society runs coding, hackathon and technical-innovation activities, including Koshish's Fixathon design challenge." },
  ];

  const societies = {};
  for (const s of societiesData) {
    const soc = await Society.create({ ...s, organization: org._id });
    societies[s.slug] = soc;
  }
  console.log(`[seed] Created ${societiesData.length} societies`);

  const koshishStart = new Date('2026-03-10T09:00:00+05:30');
  const koshishEnd = new Date('2026-03-14T18:00:00+05:30');

  const koshish = await Event.create({
    organization: org._id,
    society: societies['koshish']._id,
    title: 'Koshish 2026',
    slug: 'koshish-2026',
    description:
      "Festaweek (Koshish) is the heartbeat of PCTE: its premier annual cultural and literary festival, celebrating creativity, confidence and the vibrant spirit of campus life.",
    venue: 'PCTE Campus I & II, Ludhiana',
    startDate: koshishStart,
    endDate: koshishEnd,
    status: 'published',
    tags: ['fest', 'koshish', 'cultural', 'literary'],
    createdBy: owner._id,
    managers: [owner._id],
    ticketTypes: [
      { name: 'General', price: 0, capacity: null, registered: 0 },
      { name: 'Participant', price: 0, capacity: null, registered: 0 },
    ],
    socialLinks: {
      facebookUrl: 'https://www.facebook.com/pctegroup/',
      instagramUrl: 'https://www.instagram.com/pcteofficial/?hl=en',
      youtubeChannelUrl: 'https://youtube.com/@pctegroupofinstitutes?si=86Z_q8rap1tIILjK',
      youtubeVideoId: '36KQrBZlukY',
    },
  });
  console.log(`[seed] Created event: ${koshish.title}`);

  const jasmine = await upsertJasmineEvent({ organization: org, owner, society: societies.koshish });
  console.log(`[seed] Created event: ${jasmine.title}`);

  return { org, owner, societies, koshish, jasmine };
}

module.exports = seed;
