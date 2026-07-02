const { z } = require("zod");
const prisma = require("../config/db");
const { createNotification } = require("../utils/notify");
const { getIO } = require("../config/socket");

const createCommentSchema = z.object({
  text: z.string().min(1).max(1000),
});

async function getComments(req, res) {
  const { id: postId } = req.params;

  const comments = await prisma.comment.findMany({
    where: { postId },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { id: true, username: true, profileImage: true } } },
  });

  return res.json(comments);
}

async function addComment(req, res) {
  const { id: postId } = req.params;
  const { text } = createCommentSchema.parse(req.body);

  const post = await prisma.post.findUnique({ where: { id: postId } });
  if (!post) return res.status(404).json({ error: "Post not found" });

  const comment = await prisma.comment.create({
    data: { text, postId, userId: req.user.id },
    include: { user: { select: { id: true, username: true, profileImage: true } } },
  });

  await createNotification({
    type: "COMMENT",
    recipientId: post.userId,
    actorId: req.user.id,
    postId,
  });

  try {
    getIO().to(`user:${post.userId}`).emit("post:new-comment", { postId, comment });
    // Also notify the commenter's own other sessions / anyone viewing the post could be added
    // via a `post:${postId}` room if you want post-detail pages to update live for all viewers.
  } catch (err) {
    // socket layer may be unavailable
  }

  return res.status(201).json(comment);
}

async function deleteComment(req, res) {
  const { commentId } = req.params;

  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) return res.status(404).json({ error: "Comment not found" });
  if (comment.userId !== req.user.id) {
    return res.status(403).json({ error: "You can only delete your own comments" });
  }

  await prisma.comment.delete({ where: { id: commentId } });
  return res.json({ success: true });
}

module.exports = { getComments, addComment, deleteComment };
