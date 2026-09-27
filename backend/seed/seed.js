const mongoose = require('mongoose');
const seedBase = require('./seedBase');
const koshishCompetitionEvents = require('./koshishEvents');
const seedExtras = require('./seedExtras');
const CompetitionEvent = require('../models/CompetitionEvent');

async function run() {
  const { org, owner, societies, koshish } = await seedBase();

  const docs = koshishCompetitionEvents.map((ce) => ({ ...ce, organization: org._id, event: koshish._id }));
  await CompetitionEvent.insertMany(docs);
  console.log(`[seed] Inserted ${docs.length} Koshish 2026 competition events`);

  await seedExtras({ org, owner, koshish });

  console.log('\n[seed] Done. Your real account:');
  console.log(`  org_admin -> ${owner.email}`);
  console.log('\n[seed] No dummy participants/volunteers/judges were created.');
  console.log('[seed] Register real accounts for those roles at http://localhost:5173/register');
  console.log('[seed] (Staff roles — event_manager, volunteer, judge, sponsor_viewer — can be');
  console.log('[seed]  promoted from org_admin later; self-signup only allows participant/volunteer/sponsor_viewer.)');

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
