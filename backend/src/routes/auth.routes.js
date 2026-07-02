const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { requireAuth } = require("../middleware/auth");
const { uploadProfile } = require("../config/cloudinary");
const { register, login, logout, me } = require("../controllers/auth.controller");

const router = express.Router();

router.post("/register", uploadProfile.single("profileImage"), asyncHandler(register));
router.post("/login", asyncHandler(login));
router.post("/logout", asyncHandler(logout));
router.get("/me", requireAuth, asyncHandler(me));

module.exports = router;
