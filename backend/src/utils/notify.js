const prisma = require("../config/db");
const { getIO } = require("../config/socket");

// type: "LIKE" | "COMMENT" | "FOLLOW"
async function createNotification({ type, recipientId, actorId, postId }) {
  // Don't notify yourself (e.g. liking your own post)
  if (recipientId === actorId) return null;

  const notification = await prisma.notification.create({
    data: { type, recipientId, actorId, postId },
    include: {
      actor: { select: { id: true, username: true, profileImage: true } },
      post: { select: { id: true, imageUrl: true } },
    },
  });

  try {
    getIO().to(`user:${recipientId}`).emit("notification:new", notification);
  } catch (err) {
    // Socket layer might not be initialized in some contexts (e.g. tests) - ignore.
  }

  return notification;
}

module.exports = { createNotification };
