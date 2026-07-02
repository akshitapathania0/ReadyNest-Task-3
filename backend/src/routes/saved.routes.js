const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const { toggleSave, getSavedPosts } = require("../controllers/saved.controller");

const router = express.Router();

router.get("/", requireAuth, asyncHandler(getSavedPosts));
router.post("/:id", requireAuth, asyncHandler(toggleSave));

module.exports = router;
