const express = require('express');
const ctrl = require('../controllers/youtubeController');

const router = express.Router();

router.get('/videos', ctrl.listChannelVideos);
router.get('/status', ctrl.getChannelStatus);

module.exports = router;
