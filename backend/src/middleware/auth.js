const { verifyToken, COOKIE_NAME } = require("../utils/jwt");
const prisma = require("../config/db");

// Requires a valid session; 401s otherwise.
async function requireAuth(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    req.user = { id: user.id, username: user.username, email: user.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
}

// Attaches req.user if a valid session exists, but does not block the request.
async function attachUserIfPresent(req, res, next) {
  try {
    const token = req.cookies?.[COOKIE_NAME];
    if (!token) return next();

    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (user) {
      req.user = { id: user.id, username: user.username, email: user.email };
    }
    next();
  } catch (err) {
    next();
  }
}

module.exports = { requireAuth, attachUserIfPresent };
