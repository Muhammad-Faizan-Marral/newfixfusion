// const express = require("express");
// const router = express.Router();
// const pool = require("../config/db");

// // Add this to your backend routes (e.g., in messageRoutes.js)
// router.get('/api/messages/:userId/:technicianId', async (req, res) => {
//   try {
//     const { userId, technicianId } = req.params;
//     const result = await pool.query(
//       `SELECT * FROM messages 
//        WHERE (sender_id = $1 AND receiver_id = $2) 
//        OR (sender_id = $2 AND receiver_id = $1) 
//        ORDER BY created_at ASC`,
//       [userId, technicianId]
//     );
    
//     const messages = result.rows.map(row => ({
//       senderId: row.sender_id,
//       receiverId: row.receiver_id,
//       message: row.message,
//       timestamp: row.created_at,
//       type: row.type
//     }));
    
//     res.json(messages);
//   } catch (error) {
//     console.error('Error fetching messages:', error);
//     res.status(500).json({ error: 'Failed to fetch messages' });
//   }
// });

// module.exports = router;
