const Organization = require('../models/Organization');

/**
 * For public (unauthenticated) routes, resolves which organization's data to
 * serve. Accepts ?org=<slug> query param, otherwise falls back to the
 * platform's default seeded organization ("pcte").
 */
async function resolveOrg(req, res, next) {
  try {
    const slug = req.query.org || 'pcte';
    const org = await Organization.findOne({ slug: slug.toLowerCase(), isActive: true }).select('_id slug name brandColors logoUrl');
    if (!org) {
      return res.status(404).json({ success: false, message: `Organization '${slug}' not found` });
    }
    req.orgId = org._id;
    req.org = org;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = resolveOrg;
