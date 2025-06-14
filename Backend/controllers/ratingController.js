// controllers/ratingController.js
const {
  giveRating,
  getRatingsByTechnician,
  getTechnicianAvgRating
} = require('../models/ratingModel');

const postRating = async (req, res) => {
  try {
    const { technician_id, customer_id, rating, comment } = req.body;

    if (!technician_id || !customer_id || !rating) {
      return res.status(400).json({ message: 'Required fields missing.' });
    }

    const newRating = await giveRating({ technician_id, customer_id, rating, comment });
    res.status(201).json({ message: 'Rating submitted.', rating: newRating });
  } catch (err) {
    console.error('Post Rating Error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

const getTechnicianRatings = async (req, res) => {
  try {
    const { id } = req.params;
    const ratings = await getRatingsByTechnician(id);
    const summary = await getTechnicianAvgRating(id);

    res.status(200).json({
      average_rating: summary.avg_rating,
      total_reviews: summary.total_reviews,
      ratings: ratings
    });
  } catch (err) {
    console.error('Get Ratings Error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

module.exports = {
  postRating,
  getTechnicianRatings
};
