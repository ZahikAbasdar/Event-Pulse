const express = require('express');
const ctrl = require('../controllers/societyController');
const { protect, authorize } = require('../middleware/auth');
const resolveOrg = require('../middleware/resolveOrg');

const router = express.Router();

router.get('/', resolveOrg, ctrl.listSocieties);
router.get('/:slug', resolveOrg, ctrl.getSociety);

router.post('/', protect, authorize('super_admin', 'org_admin'), ctrl.createSociety);
router.patch('/:id', protect, authorize('super_admin', 'org_admin', 'event_manager'), ctrl.updateSociety);
router.post('/:id/gallery', protect, authorize('super_admin', 'org_admin', 'event_manager'), ctrl.addGalleryItem);

module.exports = router;
