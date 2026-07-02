const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth, attachUserIfPresent } = require("../middleware/auth");
const { uploadPost } = require("../config/cloudinary");
const {
  getFeed,
  getPost,
  createPost,
  editCaption,
  deletePost,
  toggleLike,
} = require("../controllers/post.controller");

const router = express.Router();

router.get("/feed", requireAuth, asyncHandler(getFeed));
router.get("/:id", attachUserIfPresent, asyncHandler(getPost));
router.post("/", requireAuth, uploadPost.array("images", 5), asyncHandler(createPost));
router.put("/:id", requireAuth, asyncHandler(editCaption));
router.delete("/:id", requireAuth, asyncHandler(deletePost));
router.post("/:id/like", requireAuth, asyncHandler(toggleLike));

module.exports = router;
