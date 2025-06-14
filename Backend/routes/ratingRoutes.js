// routes/ratingRoutes.js
const express = require('express');
const router = express.Router();
const {
  postRating,
  getTechnicianRatings
} = require('../controllers/ratingController');

// Customer gives rating
router.post('/', postRating);

// View technician ratings + average
router.get('/technician/:id', getTechnicianRatings);

module.exports = router;
