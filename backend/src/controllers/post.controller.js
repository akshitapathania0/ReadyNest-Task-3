const { z } = require("zod");
const prisma = require("../config/db");
const { cloudinary } = require("../config/cloudinary");
const { createNotification } = require("../utils/notify");
const { getIO } = require("../config/socket");

const createPostSchema = z.object({
  caption: z.string().max(2200).optional(),
});

const editCaptionSchema = z.object({
  caption: z.string().max(2200),
});

const PAGE_SIZE = 10;

function withMeta(post, viewerId, savedPostIds = new Set()) {
  const { _count, likes, ...rest } = post;
  return {
    ...rest,
    likeCount: _count?.likes ?? 0,
    commentCount: _count?.comments ?? 0,
    likedByMe: viewerId ? (likes || []).length > 0 : false,
    savedByMe: viewerId ? savedPostIds.has(post.id) : false,
  };
}

// Feed: ALL posts from all users, paginated (explore style)
async function getFeed(req, res) {
  const viewerId = req.user.id;
  const cursor = req.query.cursor ? req.query.cursor.toString() : undefined;

  const [posts, savedRecords] = await Promise.all([
    prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      include: {
        user: { select: { id: true, username: true, profileImage: true } },
        _count: { select: { likes: true, comments: true } },
        likes: { where: { userId: viewerId }, select: { id: true } },
      },
    }),
    prisma.savedPost.findMany({
      where: { userId: viewerId },
      select: { postId: true },
    }),
  ]);

  const savedPostIds = new Set(savedRecords.map((s) => s.postId));
  const hasMore = posts.length > PAGE_SIZE;
  const page = hasMore ? posts.slice(0, PAGE_SIZE) : posts;

  return res.json({
    posts: page.map((p) => withMeta(p, viewerId, savedPostIds)),
    nextCursor: hasMore ? page[page.length - 1].id : null,
  });
}

async function getPost(req, res) {
  const { id } = req.params;
  const viewerId = req.user?.id;

  const [post, savedRecord] = await Promise.all([
    prisma.post.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, profileImage: true } },
        _count: { select: { likes: true, comments: true } },
        likes: viewerId ? { where: { userId: viewerId }, select: { id: true } } : false,
      },
    }),
    viewerId
      ? prisma.savedPost.findUnique({ where: { userId_postId: { userId: viewerId, postId: id } } })
      : Promise.resolve(null),
  ]);

  if (!post) return res.status(404).json({ error: "Post not found" });

  const savedPostIds = savedRecord ? new Set([id]) : new Set();
  return res.json(withMeta(post, viewerId, savedPostIds));
}

async function createPost(req, res) {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: "At least one image is required" });
  }

  const { caption } = createPostSchema.parse(req.body);

  const created = await prisma.$transaction(
    req.files.map((file) =>
      prisma.post.create({
        data: {
          caption,
          imageUrl: file.path,
          imagePublicId: file.filename,
          userId: req.user.id,
        },
      })
    )
  );

  return res.status(201).json(created);
}

async function editCaption(req, res) {
  const { id } = req.params;
  const { caption } = editCaptionSchema.parse(req.body);

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return res.status(404).json({ error: "Post not found" });
  if (post.userId !== req.user.id) {
    return res.status(403).json({ error: "You can only edit your own posts" });
  }

  const updated = await prisma.post.update({ where: { id }, data: { caption } });
  return res.json(updated);
}

async function deletePost(req, res) {
  const { id } = req.params;

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) return res.status(404).json({ error: "Post not found" });
  if (post.userId !== req.user.id) {
    return res.status(403).json({ error: "You can only delete your own posts" });
  }

  if (post.imagePublicId) {
    try {
      await cloudinary.uploader.destroy(post.imagePublicId);
    } catch (err) {
      console.error("Cloudinary delete failed:", err.message);
    }
  }

  await prisma.post.delete({ where: { id } });
  return res.json({ success: true });
}

async function toggleLike(req, res) {
  const { id: postId } = req.params;
  const userId = req.user.id;

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return res.status(404).json({ error: "Post not found" });

  const existingLike = await prisma.like.findUnique({
    where: { userId_postId: { userId, postId } },
  });

  let liked;
  if (existingLike) {
    await prisma.like.delete({ where: { userId_postId: { userId, postId } } });
    liked = false;
  } else {
    await prisma.like.create({ data: { userId, postId } });
    liked = true;
    await createNotification({ type: "LIKE", recipientId: post.userId, actorId: userId, postId });
  }

  const count = await prisma.like.count({ where: { postId } });

  try {
    getIO().to(`user:${post.userId}`).emit("post:like-update", { postId, count, liked, userId });
  } catch (err) {
    // socket layer may be unavailable
  }

  return res.json({ liked, count });
}

module.exports = { getFeed, getPost, createPost, editCaption, deletePost, toggleLike };
