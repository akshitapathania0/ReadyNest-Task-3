const bcrypt = require("bcryptjs");
const { z } = require("zod");
const prisma = require("../config/db");
const { signToken, COOKIE_NAME, cookieOptions } = require("../utils/jwt");

const registerSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_.]+$/, "Username can only contain letters, numbers, . and _"),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    bio: user.bio,
    profileImage: user.profileImage,
  };
}

async function register(req, res) {
  const { email, username, password } = registerSchema.parse(req.body);

  const existing = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
  });
  if (existing) {
    return res.status(409).json({ error: "Email or username already in use" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  let profileImage = null;
  if (req.file) {
    profileImage = req.file.path; // Cloudinary secure URL via multer-storage-cloudinary
  }

  const user = await prisma.user.create({
    data: { email, username, password: hashedPassword, profileImage },
  });

  const token = signToken(user.id);
  res.cookie(COOKIE_NAME, token, cookieOptions);

  return res.status(201).json(publicUser(user));
}

async function login(req, res) {
  const { email, password } = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = signToken(user.id);
  res.cookie(COOKIE_NAME, token, cookieOptions);

  return res.json(publicUser(user));
}

async function logout(req, res) {
  res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: undefined });
  return res.json({ success: true });
}

async function me(req, res) {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ error: "User not found" });
  return res.json(publicUser(user));
}

module.exports = { register, login, logout, me };
