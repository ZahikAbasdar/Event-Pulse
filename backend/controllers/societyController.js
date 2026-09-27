const Society = require('../models/Society');
const asyncHandler = require('../middleware/asyncHandler');
const { ApiError } = require('../middleware/errorHandler');

// @route GET /api/societies  (public)
exports.listSocieties = asyncHandler(async (req, res) => {
  const societies = await Society.find({ organization: req.orgId, isActive: true }).sort({ name: 1 });
  res.json({ success: true, societies });
});

// @route GET /api/societies/:slug (public)
exports.getSociety = asyncHandler(async (req, res) => {
  const society = await Society.findOne({ organization: req.orgId, slug: req.params.slug });
  if (!society) throw new ApiError(404, 'Society not found');
  res.json({ success: true, society });
});

// @route POST /api/societies (org_admin, event_manager)
exports.createSociety = asyncHandler(async (req, res) => {
  const { name, slug, tagline, description, colorTheme, coverImageUrl, logoUrl } = req.body;
  const society = await Society.create({
    organization: req.user.organization,
    name,
    slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
    tagline,
    description,
    colorTheme,
    coverImageUrl,
    logoUrl,
  });
  res.status(201).json({ success: true, society });
});

// @route PATCH /api/societies/:id
exports.updateSociety = asyncHandler(async (req, res) => {
  const society = await Society.findOneAndUpdate(
    { _id: req.params.id, organization: req.user.organization },
    req.body,
    { new: true, runValidators: true }
  );
  if (!society) throw new ApiError(404, 'Society not found');
  res.json({ success: true, society });
});

// @route POST /api/societies/:id/gallery
exports.addGalleryItem = asyncHandler(async (req, res) => {
  const { url, caption } = req.body;
  if (!url) throw new ApiError(400, 'url is required (platform-uploaded media only)');
  const society = await Society.findOneAndUpdate(
    { _id: req.params.id, organization: req.user.organization },
    { $push: { gallery: { url, caption } } },
    { new: true }
  );
  if (!society) throw new ApiError(404, 'Society not found');
  res.status(201).json({ success: true, society });
});
