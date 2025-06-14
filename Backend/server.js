// server.js - Updated with better location support and error handling
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");
const pool = require("./config/db");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
const authRoutes = require("./routes/authRoutes");
const customerRoutes = require("./routes/customerRoutes");
const bidRoutes = require("./routes/bidRoutes");
const ratingRoutes = require("./routes/ratingRoutes");
const technicianRoutes = require("./routes/technicianRoutes");
const jobRoutes = require("./routes/jobRoutes");
const adminRoutes = require("./routes/adminRoutes");
const mlRoutes = require("./routes/mlRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/customer", customerRoutes);
app.use("/api/bid", bidRoutes);
app.use("/api/rating", ratingRoutes);
app.use("/api/technician", technicianRoutes);
app.use("/api/job", jobRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/ml", mlRoutes);
app.use('/uploads', express.static('uploads'));
app.use("/api", require("./routes/mlRoutes"));

// MESSAGE ROUTES - Improved with better error handling
app.get('/api/messages/:userId/:technicianId', async (req, res) => {
  try {
    const { userId, technicianId } = req.params;
    console.log(`🔍 Fetching messages between User:${userId} and Technician:${technicianId}`);
    
    // Validate user IDs
    if (!userId || !technicianId) {
      return res.status(400).json({ error: 'User ID and Technician ID are required' });
    }
    
    const result = await pool.query(
      `SELECT id, sender_id, receiver_id, message, type, location_data, created_at, is_read 
       FROM messages 
       WHERE (sender_id = $1 AND receiver_id = $2) 
       OR (sender_id = $2 AND receiver_id = $1) 
       ORDER BY created_at ASC`,
      [userId, technicianId]
    );
    
    const messages = result.rows.map(row => ({
      id: row.id,
      senderId: parseInt(row.sender_id),
      receiverId: parseInt(row.receiver_id),
      message: row.message,
      messageType: row.type,
      locationData: row.location_data ? JSON.parse(row.location_data) : null,
      timestamp: row.created_at,
      isRead: row.is_read
    }));
    
    console.log(`✅ Found ${messages.length} messages`);
    res.json(messages);
  } catch (error) {
    console.error('❌ Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages', details: error.message });
  }
});

// Get location messages only
app.get('/api/locations/:userId/:technicianId', async (req, res) => {
  try {
    const { userId, technicianId } = req.params;
    console.log(`📍 Fetching location messages between User:${userId} and Technician:${technicianId}`);
    
    const result = await pool.query(
      `SELECT id, sender_id, receiver_id, message, type, location_data, created_at 
       FROM messages 
       WHERE ((sender_id = $1 AND receiver_id = $2) 
       OR (sender_id = $2 AND receiver_id = $1))
       AND type = 'location'
       AND location_data IS NOT NULL
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId, technicianId]
    );
    
    const locationMessages = result.rows.map(row => ({
      id: row.id,
      senderId: parseInt(row.sender_id),
      receiverId: parseInt(row.receiver_id),
      message: row.message,
      messageType: row.type,
      locationData: JSON.parse(row.location_data),
      timestamp: row.created_at
    }));
    
    console.log(`✅ Found ${locationMessages.length} location messages`);
    res.json(locationMessages);
  } catch (error) {
    console.error('❌ Error fetching location messages:', error);
    res.status(500).json({ error: 'Failed to fetch location messages', details: error.message });
  }
});

// Mark messages as read
app.put('/api/messages/read', async (req, res) => {
  try {
    const { userId, technicianId } = req.body;
    
    if (!userId || !technicianId) {
      return res.status(400).json({ error: 'User ID and Technician ID are required' });
    }
    
    const result = await pool.query(
      `UPDATE messages 
       SET is_read = true 
       WHERE receiver_id = $1 AND sender_id = $2 AND is_read = false`,
      [userId, technicianId]
    );
    
    console.log(`✅ Marked ${result.rowCount} messages as read for user: ${userId}`);
    res.json({ success: true, updatedCount: result.rowCount });
  } catch (error) {
    console.error('❌ Error marking messages as read:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

// Get unread message count
app.get('/api/messages/unread/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const result = await pool.query(
      `SELECT COUNT(*) as unread_count FROM messages 
       WHERE receiver_id = $1 AND is_read = false`,
      [userId]
    );
    
    const unreadCount = parseInt(result.rows[0].unread_count);
    console.log(`📊 User ${userId} has ${unreadCount} unread messages`);
    res.json({ unreadCount });
  } catch (error) {
    console.error('❌ Error getting unread count:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// Test endpoint to check database connection
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      status: 'Database connected', 
      time: result.rows[0].now,
      message: 'Database is working properly'
    });
  } catch (error) {
    console.error('❌ Database test failed:', error);
    res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
});

// Home
app.get("/", (req, res) => {
  res.send("FixFusion Backend with Real-Time Chat and Location Sharing Running...");
});

// SOCKET.IO CHAT LOGIC - Improved with better location handling
io.on("connection", (socket) => {
  console.log("🟢 New user connected:", socket.id);

  // Join Room
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    console.log(`🏠 User ${socket.id} joined room ${roomId}`);
    socket.emit("roomJoined", { roomId, message: "Successfully joined room" });
  });

  // Leave Room
  socket.on("leaveRoom", (roomId) => {
    socket.leave(roomId);
    console.log(`🚪 User ${socket.id} left room ${roomId}`);
  });

  // Send Message - Enhanced with better location handling
  socket.on("sendMessage", async (data) => {
    console.log("📨 Received message data:", JSON.stringify(data, null, 2));
    
    try {
      const { senderId, receiverId, message, messageType = 'text', locationData } = data;
      
      // Validate required fields
      if (!senderId || !receiverId || !message) {
        console.error('❌ Missing required message fields');
        socket.emit("messageError", { error: "Missing required fields" });
        return;
      }
      
      // Create room ID
      const roomId = [senderId, receiverId].sort().join('-');
      console.log(`💬 Processing ${messageType} message for room: ${roomId}`);
      
      // Prepare database query
      let query, values;
      
      if (messageType === 'location' && locationData) {
        console.log('📍 Processing location message with data:', locationData);
        
        // Validate location data
        if (!locationData.latitude || !locationData.longitude) {
          console.error('❌ Invalid location data');
          socket.emit("messageError", { error: "Invalid location data" });
          return;
        }
        
        query = `INSERT INTO messages (sender_id, receiver_id, message, type, location_data, created_at, is_read)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`;
        values = [
          parseInt(senderId), 
          parseInt(receiverId), 
          message, 
          messageType, 
          JSON.stringify(locationData), 
          new Date(),
          false
        ];
      } else {
        console.log('💬 Processing text message');
        query = `INSERT INTO messages (sender_id, receiver_id, message, type, created_at, is_read)
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`;
        values = [
          parseInt(senderId), 
          parseInt(receiverId), 
          message, 
          messageType || 'text', 
          new Date(),
          false
        ];
      }
      
      // Save to database
      const dbResult = await pool.query(query, values);
      console.log("💾 Message saved to DB with ID:", dbResult.rows[0].id);
      
      // Prepare message data for broadcasting
      const messageData = {
        id: dbResult.rows[0].id,
        senderId: parseInt(senderId),
        receiverId: parseInt(receiverId),
        message,
        messageType: messageType || 'text',
        timestamp: dbResult.rows[0].created_at,
        isRead: false
      };
      
      // Add location data if it exists
      if (messageType === 'location' && locationData) {
        messageData.locationData = locationData;
        console.log('📍 Location data added to broadcast message');
      }
      
      // Broadcast to room
      io.to(roomId).emit("receiveMessage", messageData);
      console.log(`📤 ${messageType} message broadcasted to room ${roomId}`);
      
      // Send confirmation to sender
      socket.emit("messageSent", { 
        success: true, 
        messageId: dbResult.rows[0].id,
        messageType: messageType 
      });
      
    } catch (err) {
      console.error("❌ Message processing error:", err);
      socket.emit("messageError", { 
        error: "Failed to save message", 
        details: err.message 
      });
    }
  });

  // Handle typing status
  socket.on("typing", (data) => {
    const { senderId, receiverId, isTyping } = data;
    const roomId = [senderId, receiverId].sort().join('-');
    socket.to(roomId).emit("userTyping", { senderId, isTyping });
  });

  // Handle connection errors
  socket.on("connect_error", (error) => {
    console.error("❌ Socket connection error:", error);
  });

  // Disconnect
  socket.on("disconnect", (reason) => {
    console.log("🔴 User disconnected:", socket.id, "Reason:", reason);
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('❌ Global error:', err);
  res.status(500).json({ 
    error: 'Internal server error', 
    details: err.message 
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌐 Socket.IO server ready for connections`);
});