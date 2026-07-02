const prisma = require("../config/db");

async function getNotifications(req, res) {
  const userId = req.user.id;

  const notifications = await prisma.notification.findMany({
    where: { recipientId: userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      actor: { select: { id: true, username: true, profileImage: true } },
      post: { select: { id: true, imageUrl: true } },
    },
  });

  return res.json(notifications);
}

async function markAsRead(req, res) {
  const userId = req.user.id;
  const { id } = req.params;

  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.recipientId !== userId) {
    return res.status(404).json({ error: "Notification not found" });
  }

  const updated = await prisma.notification.update({ where: { id }, data: { read: true } });
  return res.json(updated);
}

async function markAllAsRead(req, res) {
  const userId = req.user.id;
  await prisma.notification.updateMany({
    where: { recipientId: userId, read: false },
    data: { read: true },
  });
  return res.json({ success: true });
}

module.exports = { getNotifications, markAsRead, markAllAsRead };
