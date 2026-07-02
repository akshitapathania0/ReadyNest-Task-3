const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage for post images
const postStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "instagram-clone/posts",
    allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
    transformation: [{ width: 1080, crop: "limit", quality: "auto" }],
  },
});

// Storage for profile images
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "instagram-clone/profiles",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 400, height: 400, crop: "fill", quality: "auto" }],
  },
});

const uploadPost = multer({
  storage: postStorage,
  limits: { fileSize: 8 * 1024 * 1024, files: 5 }, // 8MB per file, up to 5 files
});

const uploadProfile = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
});

module.exports = { cloudinary, uploadPost, uploadProfile };
