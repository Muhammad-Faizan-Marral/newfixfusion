// routes/bidRoutes.js
const express = require('express');
const router = express.Router();
const { postBid, getBids } = require('../controllers/bidController');

// Place bid
router.post('/', postBid);

// Get all bids for a request
router.get('/:request_id', getBids);

module.exports = router;
