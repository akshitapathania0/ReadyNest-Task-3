const prisma = require("../config/db");
const { getIO } = require("../config/socket");

// Get list of conversations (people you've messaged or who messaged you, that you follow)
async function getConversations(req, res) {
  const userId = req.user.id;

  // Get users the current user follows
  const following = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const followingIds = following.map((f) => f.followingId);

  // Get latest message per conversation partner (among followed users + anyone who messaged you)
  const messages = await prisma.message.findMany({
    where: {
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    orderBy: { createdAt: "desc" },
    include: {
      sender: { select: { id: true, username: true, profileImage: true } },
      receiver: { select: { id: true, username: true, profileImage: true } },
    },
  });

  // Deduplicate by partner, keep latest
  const seen = new Map();
  for (const msg of messages) {
    const partnerId = msg.senderId === userId ? msg.receiverId : msg.senderId;
    const partner = msg.senderId === userId ? msg.receiver : msg.sender;
    if (!seen.has(partnerId)) {
      seen.set(partnerId, {
        partner,
        lastMessage: msg,
        unread: msg.receiverId === userId && !msg.read ? 1 : 0,
      });
    } else if (msg.receiverId === userId && !msg.read) {
      seen.get(partnerId).unread++;
    }
  }

  // Also include followed users with no messages yet
  const followedUsers = await prisma.user.findMany({
    where: { id: { in: followingIds.filter((id) => !seen.has(id)) } },
    select: { id: true, username: true, profileImage: true },
  });
  for (const u of followedUsers) {
    seen.set(u.id, { partner: u, lastMessage: null, unread: 0 });
  }

  return res.json(Array.from(seen.values()));
}

// Get messages between current user and another user
async function getMessages(req, res) {
  const userId = req.user.id;
  const { partnerId } = req.params;

  const messages = await prisma.message.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: partnerId },
        { senderId: partnerId, receiverId: userId },
      ],
    },
    orderBy: { createdAt: "asc" },
    include: {
      sender: { select: { id: true, username: true, profileImage: true } },
    },
  });

  // Mark messages from partner as read
  await prisma.message.updateMany({
    where: { senderId: partnerId, receiverId: userId, read: false },
    data: { read: true },
  });

  return res.json(messages);
}

// Send a message
async function sendMessage(req, res) {
  const userId = req.user.id;
  const { partnerId } = req.params;
  const { text } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: "Message text is required" });
  }

  const receiver = await prisma.user.findUnique({ where: { id: partnerId } });
  if (!receiver) return res.status(404).json({ error: "User not found" });

  const message = await prisma.message.create({
    data: { senderId: userId, receiverId: partnerId, text: text.trim() },
    include: {
      sender: { select: { id: true, username: true, profileImage: true } },
    },
  });

  // Emit to both sender and receiver via socket
  try {
    const io = getIO();
    io.to(`user:${partnerId}`).emit("message:new", message);
    io.to(`user:${userId}`).emit("message:new", message);
  } catch (err) {
    // socket unavailable
  }

  return res.status(201).json(message);
}

module.exports = { getConversations, getMessages, sendMessage };
