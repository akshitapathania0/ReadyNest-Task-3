const { z } = require("zod");
const prisma = require("../config/db");
const { createNotification } = require("../utils/notify");
const { getIO } = require("../config/socket");

const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_.]+$/)
    .optional(),
  bio: z.string().max(500).optional(),
});

async function getProfile(req, res) {
  const { id } = req.params;
  const viewerId = req.user?.id;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      _count: { select: { posts: true, followers: true, following: true } },
      posts: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { likes: true, comments: true } } },
      },
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  let isFollowing = false;
  if (viewerId && viewerId !== id) {
    const follow = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: viewerId, followingId: id } },
    });
    isFollowing = !!follow;
  }

  const { password, ...safeUser } = user;
  return res.json({ ...safeUser, isFollowing });
}

async function updateProfile(req, res) {
  const { id } = req.params;

  if (req.user.id !== id) {
    return res.status(403).json({ error: "You can only edit your own profile" });
  }

  const data = updateProfileSchema.parse(req.body);

  if (data.username) {
    const existing = await prisma.user.findFirst({
      where: { username: data.username, NOT: { id } },
    });
    if (existing) {
      return res.status(409).json({ error: "Username already taken" });
    }
  }

  if (req.file) {
    data.profileImage = req.file.path;
  }

  const user = await prisma.user.update({ where: { id }, data });

  return res.json({
    id: user.id,
    email: user.email,
    username: user.username,
    bio: user.bio,
    profileImage: user.profileImage,
  });
}

async function toggleFollow(req, res) {
  const { id: followingId } = req.params;
  const followerId = req.user.id;

  if (followerId === followingId) {
    return res.status(400).json({ error: "Cannot follow yourself" });
  }

  const targetUser = await prisma.user.findUnique({ where: { id: followingId } });
  if (!targetUser) {
    return res.status(404).json({ error: "User not found" });
  }

  const existingFollow = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId } },
  });

  let following;
  if (existingFollow) {
    await prisma.follow.delete({
      where: { followerId_followingId: { followerId, followingId } },
    });
    following = false;
  } else {
    await prisma.follow.create({ data: { followerId, followingId } });
    following = true;
    await createNotification({ type: "FOLLOW", recipientId: followingId, actorId: followerId });
  }

  const followerCount = await prisma.follow.count({ where: { followingId } });

  try {
    getIO().to(`user:${followingId}`).emit("follow:update", { followingId, followerCount, following });
  } catch (err) {
    // socket layer may be unavailable in some contexts
  }

  return res.json({ following, followerCount });
}

async function getFollowers(req, res) {
  const { id } = req.params;
  const follows = await prisma.follow.findMany({
    where: { followingId: id },
    include: {
      follower: { select: { id: true, username: true, profileImage: true, bio: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return res.json(follows.map((f) => f.follower));
}

async function getFollowing(req, res) {
  const { id } = req.params;
  const follows = await prisma.follow.findMany({
    where: { followerId: id },
    include: {
      following: { select: { id: true, username: true, profileImage: true, bio: true } },
    },
    orderBy: { createdAt: "desc" },
  });
  return res.json(follows.map((f) => f.following));
}

async function searchUsers(req, res) {
  const q = (req.query.q || "").toString().trim();
  if (!q) return res.json([]);

  const users = await prisma.user.findMany({
    where: { username: { contains: q } },
    select: { id: true, username: true, profileImage: true, bio: true },
    take: 20,
  });

  return res.json(users);
}

async function suggestedUsers(req, res) {
  // Simple suggestion: users the current user doesn't already follow, most recent first.
  const currentUserId = req.user.id;
  const following = await prisma.follow.findMany({
    where: { followerId: currentUserId },
    select: { followingId: true },
  });
  const excludeIds = [currentUserId, ...following.map((f) => f.followingId)];

  const users = await prisma.user.findMany({
    where: { id: { notIn: excludeIds } },
    select: { id: true, username: true, profileImage: true, bio: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return res.json(users);
}

module.exports = {
  getProfile,
  updateProfile,
  toggleFollow,
  getFollowers,
  getFollowing,
  searchUsers,
  suggestedUsers,
};
