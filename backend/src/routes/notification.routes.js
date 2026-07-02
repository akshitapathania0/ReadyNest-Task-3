const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
} = require("../controllers/notification.controller");

const router = express.Router();

router.get("/", requireAuth, asyncHandler(getNotifications));
router.put("/:id/read", requireAuth, asyncHandler(markAsRead));
router.put("/read-all", requireAuth, asyncHandler(markAllAsRead));

module.exports = router;
