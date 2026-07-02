const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth, attachUserIfPresent } = require("../middleware/auth");
const { uploadProfile } = require("../config/cloudinary");
const {
  getProfile,
  updateProfile,
  toggleFollow,
  getFollowers,
  getFollowing,
  searchUsers,
  suggestedUsers,
} = require("../controllers/user.controller");

const router = express.Router();

router.get("/search", requireAuth, asyncHandler(searchUsers));
router.get("/suggestions", requireAuth, asyncHandler(suggestedUsers));
router.get("/:id", attachUserIfPresent, asyncHandler(getProfile));
router.put("/:id", requireAuth, uploadProfile.single("profileImage"), asyncHandler(updateProfile));
router.post("/:id/follow", requireAuth, asyncHandler(toggleFollow));
router.get("/:id/followers", asyncHandler(getFollowers));
router.get("/:id/following", asyncHandler(getFollowing));

module.exports = router;
