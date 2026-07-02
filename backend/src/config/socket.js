const { Server } = require("socket.io");
const cookie = require("cookie");
const { verifyToken, COOKIE_NAME } = require("../utils/jwt");

let io;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  // Authenticate the socket connection using the same httpOnly cookie as REST calls.
  io.use((socket, next) => {
    try {
      const rawCookie = socket.handshake.headers.cookie;
      if (!rawCookie) return next(new Error("Unauthorized"));

      const parsed = cookie.parse(rawCookie);
      const token = parsed[COOKIE_NAME];
      if (!token) return next(new Error("Unauthorized"));

      const payload = verifyToken(token);
      socket.userId = payload.id;
      next();
    } catch (err) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    // Each user joins a private room named after their id, so we can
    // target notifications/likes/comments/follows directly at them.
    socket.join(`user:${socket.userId}`);

    socket.on("disconnect", () => {
      // no-op, room membership is cleaned up automatically
    });
  });

  return io;
}

function getIO() {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
}

module.exports = { initSocket, getIO };
