require('dotenv').config();
const mongoose = require('mongoose');
const Organization = require('../models/Organization');
const User = require('../models/User');

function requireConfig() {
  const required = ['MONGO_URI', 'SUPER_ADMIN_NAME', 'SUPER_ADMIN_EMAIL', 'SUPER_ADMIN_PASSWORD'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length) throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  if (process.env.SUPER_ADMIN_PASSWORD.length < 12) {
    throw new Error('SUPER_ADMIN_PASSWORD must be at least 12 characters.');
  }

  const email = process.env.SUPER_ADMIN_EMAIL.trim().toLowerCase();
  const domain = email.split('@')[1] || '';
  if (!domain.endsWith('.edu') && !domain.endsWith('.edu.in')) {
    throw new Error('SUPER_ADMIN_EMAIL must use an .edu or .edu.in domain.');
  }
  return { email };
}

async function provisionSuperAdmin() {
  if (!process.argv.includes('--confirm')) {
    throw new Error('Run with --confirm only after verifying the target database and account details.');
  }
  const { email } = requireConfig();

  await mongoose.connect(process.env.MONGO_URI);
  const organization = await Organization.findOne({ slug: 'pcte' });
  if (!organization) throw new Error('PCTE organization was not found; no account was changed.');

  let user = await User.findOne({ email }).select('+password');
  if (user) {
    user.name = process.env.SUPER_ADMIN_NAME.trim();
    user.password = process.env.SUPER_ADMIN_PASSWORD;
    user.role = 'super_admin';
    user.organization = organization._id;
    user.isActive = true;
  } else {
    user = new User({
      name: process.env.SUPER_ADMIN_NAME.trim(),
      email,
      password: process.env.SUPER_ADMIN_PASSWORD,
      role: 'super_admin',
      organization: organization._id,
      isActive: true,
    });
  }

  await user.save();
  console.log('Super-admin account provisioned successfully. Password is not displayed.');
}

provisionSuperAdmin()
  .catch((err) => {
    console.error('[provision-super-admin] Failed:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
  });
