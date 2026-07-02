const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const { getConversations, getMessages, sendMessage } = require("../controllers/message.controller");

const router = express.Router();

router.get("/", requireAuth, asyncHandler(getConversations));
router.get("/:partnerId", requireAuth, asyncHandler(getMessages));
router.post("/:partnerId", requireAuth, asyncHandler(sendMessage));

module.exports = router;
