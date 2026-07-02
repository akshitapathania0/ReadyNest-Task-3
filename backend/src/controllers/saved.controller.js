const prisma = require("../config/db");

async function toggleSave(req, res) {
  const { id: postId } = req.params;
  const userId = req.user.id;

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return res.status(404).json({ error: "Post not found" });

  const existing = await prisma.savedPost.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  let saved;
  if (existing) {
    await prisma.savedPost.delete({ where: { userId_postId: { userId, postId } } });
    saved = false;
  } else {
    await prisma.savedPost.create({ data: { userId, postId } });
    saved = true;
  }

  return res.json({ saved });
}

async function getSavedPosts(req, res) {
  const userId = req.user.id;

  const saved = await prisma.savedPost.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: {
      post: {
        include: {
          user: { select: { id: true, username: true, profileImage: true } },
          _count: { select: { likes: true, comments: true } },
          likes: { where: { userId }, select: { id: true } },
        },
      },
    },
  });

  return res.json(
    saved.map((s) => ({
      ...s.post,
      likeCount: s.post._count?.likes ?? 0,
      commentCount: s.post._count?.comments ?? 0,
      likedByMe: (s.post.likes || []).length > 0,
      savedByMe: true,
    }))
  );
}

module.exports = { toggleSave, getSavedPosts };
