// controllers/bidController.js
const { placeBid, getBidsForRequest } = require('../models/bidModel');

const postBid = async (req, res) => {
  try {
    const { request_id, technician_id, price, estimated_time, message } = req.body;

    if (!request_id || !technician_id || !price || !estimated_time) {
      return res.status(400).json({ message: 'All required fields must be provided.' });
    }

    const newBid = await placeBid({ request_id, technician_id, price, estimated_time, message });
    res.status(201).json({ message: 'Bid placed successfully.', bid: newBid });
  } catch (err) {
    console.error('Post Bid Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getBids = async (req, res) => {
  try {
    const { request_id } = req.params;
    const bids = await getBidsForRequest(request_id);
    res.status(200).json(bids);
  } catch (err) {
    console.error('Get Bids Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  postBid,
  getBids
};
