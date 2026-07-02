const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const { getComments, addComment, deleteComment } = require("../controllers/comment.controller");

const router = express.Router();

// Mounted at /api/posts/:id/comments
router.get("/:id/comments", asyncHandler(getComments));
router.post("/:id/comments", requireAuth, asyncHandler(addComment));
router.delete("/comments/:commentId", requireAuth, asyncHandler(deleteComment));

module.exports = router;
