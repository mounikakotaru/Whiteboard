const { Server } = require("socket.io");

const io = new Server({
  cors: {
    origin: "http://localhost:5173", 
    methods: ["GET", "POST"]
  }
});

const roomCreators = {}; 

io.on("connection", (socket) => {
  console.log("🔌 User connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);

    const allSockets = io.sockets.adapter.rooms.get(roomId) || new Set();

    if (!roomCreators[roomId]) {
      roomCreators[roomId] = socket.id;
      console.log(` ${socket.id} marked as creator of room ${roomId}`);

      io.to(socket.id).emit("user-count", 0);
      return;
    }

    const creatorSocketId = roomCreators[roomId];

    const userCount = allSockets.has(creatorSocketId)
      ? allSockets.size - 1
      : allSockets.size;

    console.log(`👥 Updated user count in room ${roomId}: ${userCount}`);

    if (creatorSocketId) {
      io.to(creatorSocketId).emit("user-count", userCount);
    }
  });

  socket.on("canvasImage", ({ roomId, data }) => {
    socket.to(roomId).emit("canvasImage", data);
  });

  socket.on("disconnecting", () => {
    for (const roomId of socket.rooms) {
      if (roomId !== socket.id) {
        setTimeout(() => {
          const allSockets = io.sockets.adapter.rooms.get(roomId) || new Set();
          const creatorSocketId = roomCreators[roomId];

          let userCount = allSockets.has(creatorSocketId)
            ? allSockets.size - 1
            : allSockets.size;

          console.log(` A user left room ${roomId}. New count: ${userCount}`);

          if (creatorSocketId && io.sockets.sockets.get(creatorSocketId)) {
            io.to(creatorSocketId).emit("user-count", userCount);
          }
        }, 100);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("🔌 User disconnected:", socket.id);
  });
});

io.listen(5000, () => {
  console.log("Socket.IO server running at http://localhost:5000");
});