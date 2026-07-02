const { ZodError } = require("zod");
const multer = require("multer");

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error(err);

  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Invalid input", details: err.errors });
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }

  // Prisma unique constraint violation
  if (err.code === "P2002") {
    const field = Array.isArray(err.meta?.target) ? err.meta.target.join(", ") : "field";
    return res.status(409).json({ error: `${field} already in use` });
  }

  // Prisma record not found
  if (err.code === "P2025") {
    return res.status(404).json({ error: "Record not found" });
  }

  const status = err.status || 500;
  return res.status(status).json({ error: err.message || "Internal server error" });
}

module.exports = errorHandler;
