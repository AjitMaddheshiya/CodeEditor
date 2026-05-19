const express = require('express');
const http = require('http');
const cors = require('cors');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
  }
});

// MongoDB connection
let isDbConnected = false;
mongoose.connect(process.env.MONGO_URI || 'mongodb+srv://ajitDB:Ajit%4012345@cluster0.8e69h0p.mongodb.net/codesync?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => {
    console.log('Connected to MongoDB');
    isDbConnected = true;
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
    isDbConnected = false;
  });

const roomSchema = new mongoose.Schema({
  name: String,
  content: String,
  users: [{
    socketId: String,
    userName: String,
    joinedAt: { type: Date, default: Date.now }
  }],
  chatMessages: [{
    id: Number,
    userName: String,
    text: String,
    timestamp: String,
    createdAt: { type: Date, default: Date.now }
  }]
});

const Room = mongoose.model('Room', roomSchema);

// Memory database fallback store
const memoryStore = {};

const findRoom = async (roomName) => {
  if (isDbConnected) {
    try {
      const room = await Room.findOne({ name: roomName });
      if (room) return room;
    } catch (err) {
      console.error('DB error in findRoom:', err);
    }
  }
  return memoryStore[roomName] || null;
};

const createNewRoom = async (roomName) => {
  const roomData = {
    name: roomName,
    content: '',
    users: [],
    chatMessages: []
  };

  if (isDbConnected) {
    try {
      const dbRoom = new Room(roomData);
      return await dbRoom.save();
    } catch (err) {
      console.error('DB error creating room, falling back to memory:', err);
    }
  }

  // Memory fallback document mock
  memoryStore[roomName] = {
    ...roomData,
    save: async function() {
      memoryStore[this.name] = this;
      return this;
    }
  };
  return memoryStore[roomName];
};

const findRoomsByUserSocket = async (socketId) => {
  if (isDbConnected) {
    try {
      return await Room.find({ 'users.socketId': socketId });
    } catch (err) {
      console.error('DB error in findRoomsByUserSocket:', err);
    }
  }

  const results = [];
  for (const name in memoryStore) {
    const room = memoryStore[name];
    if (room.users && room.users.some(u => u.socketId === socketId)) {
      results.push(room);
    }
  }
  return results;
};

const PORT = process.env.PORT || 4000;

// Create room endpoint with better error handling
app.post('/create-room', async (req, res) => {
  try {
    const { userName } = req.body;
    if (!userName || userName.trim() === '') {
      return res.status(400).json({ error: 'User name is required' });
    }
    
    const roomName = uuidv4();
    await createNewRoom(roomName);
    console.log(`Room created: ${roomName} by ${userName}`);
    res.json({ roomName });
  } catch (error) {
    console.error('Error creating room:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Get room content endpoint with fixed syntax and error handling
app.get('/get-room-content', async (req, res) => {
  try {
    const roomName = req.query.roomName;
    const room = await findRoom(roomName);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    res.json({ content: room.content || '' });
  } catch (error) {
    console.error('Error getting room content:', error);
    res.status(500).json({ error: 'Failed to get room content' });
  }
});

// Get room users endpoint
app.get('/get-room-users', async (req, res) => {
  try {
    const roomName = req.query.roomName;
    const room = await findRoom(roomName);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    console.log(`Room ${roomName} has ${room.users.length} users:`, room.users.map(u => u.userName));
    res.json({ users: room.users || [] });
  } catch (error) {
    console.error('Error getting room users:', error);
    res.status(500).json({ error: 'Failed to get room users' });
  }
});

// Get room chat messages endpoint
app.get('/get-room-chat', async (req, res) => {
  try {
    const roomName = req.query.roomName;
    const room = await findRoom(roomName);
    
    if (!room) {
      return res.status(404).json({ error: 'Room not found' });
    }
    
    res.json({ messages: room.chatMessages || [] });
  } catch (error) {
    console.error('Error getting room chat:', error);
    res.status(500).json({ error: 'Failed to get room chat' });
  }
});

// Helper function to update and broadcast user list
const updateAndBroadcastUsers = async (roomName) => {
  try {
    const room = await findRoom(roomName);
    if (room) {
      console.log(`Broadcasting updated user list for room ${roomName}:`, room.users.map(u => u.userName));
      io.to(roomName).emit('usersList', room.users);
    }
  } catch (error) {
    console.error('Error updating and broadcasting users:', error);
  }
};

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('joinRoom', async (roomName, userName) => {
    try {
      console.log(`User ${userName} (${socket.id}) joining room: ${roomName}`);
      
      // Add user to room in database
      const room = await findRoom(roomName);
      if (room) {
        // Remove user if already exists (in case of reconnection)
        room.users = room.users.filter(user => user.socketId !== socket.id);
        
        // Add new user
        room.users.push({
          socketId: socket.id,
          userName: userName,
          joinedAt: new Date()
        });
        await room.save();
        
        // Join socket room
        socket.join(roomName);
        
        // Notify others in the room
        socket.to(roomName).emit('userJoined', `${userName} has joined the room`);
        
        // Send current users list to the new user
        socket.emit('roomUsers', room.users);
        
        // Send chat messages to the new user
        socket.emit('chatHistory', room.chatMessages || []);
        
        // Broadcast updated users list to all users in the room
        await updateAndBroadcastUsers(roomName);
      }
    } catch (error) {
      console.error('Error joining room:', error);
    }
  });
  
  socket.on('updateText', async (roomName, updatedText) => {
    try {
      const room = await findRoom(roomName);
      if (room) {
        room.content = updatedText;
        await room.save();
        socket.to(roomName).emit('textUpdated', updatedText);
      }
    } catch (error) {
      console.error('Error updating text:', error);
    }
  });

  // Chat functionality
  socket.on('sendMessage', async (data) => {
    try {
      const { roomName, message } = data;
      const room = await findRoom(roomName);
      
      if (room) {
        // Add message to database
        room.chatMessages.push(message);
        await room.save();
        
        // Broadcast message to all users in the room
        io.to(roomName).emit('chatMessage', message);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  // Typing indicators
  socket.on('userTyping', (data) => {
    socket.to(data.roomName).emit('userTyping', data);
  });

  socket.on('userStoppedTyping', (data) => {
    socket.to(data.roomName).emit('userStoppedTyping', data);
  });
  
  socket.on('leaveRoom', async (roomName) => {
    try {
      const room = await findRoom(roomName);
      if (room) {
        // Remove user from room
        const userIndex = room.users.findIndex(user => user.socketId === socket.id);
        if (userIndex !== -1) {
          const userName = room.users[userIndex].userName;
          room.users.splice(userIndex, 1);
          await room.save();
          
          // Notify others
          socket.to(roomName).emit('userLeft', `${userName} has left the room`);
          
          // Broadcast updated users list
          await updateAndBroadcastUsers(roomName);
        }
      }
      socket.leave(roomName);
    } catch (error) {
      console.error('Error leaving room:', error);
    }
  });
  
  socket.on('disconnect', async () => {
    console.log('User disconnected:', socket.id);
    
    // Remove user from all rooms they were in
    try {
      const rooms = await findRoomsByUserSocket(socket.id);
      for (const room of rooms) {
        const userIndex = room.users.findIndex(user => user.socketId === socket.id);
        if (userIndex !== -1) {
          const userName = room.users[userIndex].userName;
          room.users.splice(userIndex, 1);
          await room.save();
          
          // Notify others
          io.to(room.name).emit('userLeft', `${userName} has disconnected`);
          
          // Broadcast updated users list
          await updateAndBroadcastUsers(room.name);
        }
      }
    } catch (error) {
      console.error('Error handling disconnect:', error);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
