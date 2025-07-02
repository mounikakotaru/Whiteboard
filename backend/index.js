const { Server } = require("socket.io");

const io = new Server({
  cors: {
    origin: "http://localhost:5173", 
    methods: ["GET", "POST"]
  }
});

const roomCreators = {};   
const roomUsers = {};     

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  socket.on("join-room", ({ roomId, username }) => {
    socket.join(roomId);

    if (!roomUsers[roomId]) roomUsers[roomId] = new Set();
    roomUsers[roomId].add(username);

    socket.data.username = username;
    socket.data.roomId = roomId;

    if (!roomCreators[roomId]) {
      roomCreators[roomId] = socket.id;
      io.to(socket.id).emit("user-count", 0);
    } else {
      const allSockets = io.sockets.adapter.rooms.get(roomId) || new Set();
      const creatorSocketId = roomCreators[roomId];
      const userCount = allSockets.has(creatorSocketId)
        ? allSockets.size - 1
        : allSockets.size;

      io.to(creatorSocketId).emit("user-count", userCount);
      io.to(creatorSocketId).emit("send-current-canvas", { to: socket.id });
    }

    io.to(roomId).emit("user-list", Array.from(roomUsers[roomId]));
  });

  socket.on("canvasImage", ({ roomId, data, to }) => {
    if (to) {
      io.to(to).emit("canvasImage", data);
    } else {
      socket.to(roomId).emit("canvasImage", data);
    }
  });

  socket.on("request-sync", (roomId) => {
    const creatorSocketId = roomCreators[roomId];
    if (creatorSocketId) {
      io.to(creatorSocketId).emit("send-current-canvas", { to: socket.id });
    }
  });

  socket.on("disconnecting", () => {
    const { username, roomId } = socket.data;

    if (username && roomId && roomUsers[roomId]) {
      roomUsers[roomId].delete(username);

      setTimeout(() => {
        const allSockets = io.sockets.adapter.rooms.get(roomId) || new Set();
        const creatorSocketId = roomCreators[roomId];

        const userCount = allSockets.has(creatorSocketId)
          ? allSockets.size - 1
          : allSockets.size;

        if (creatorSocketId && io.sockets.sockets.get(creatorSocketId)) {
          io.to(creatorSocketId).emit("user-count", userCount);
        }
        io.to(roomId).emit("user-list", Array.from(roomUsers[roomId] || []));
      }, 100);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

io.listen(5000, () => {
  console.log("✅ Socket.IO server running on http://localhost:5000");
});
