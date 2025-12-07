import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { db } from "../db.js";

const router = express.Router();

// --------------------
// Helpers
// --------------------

function parseCookieCookie(req) {
  const header = req.headers.cookie || "";
  return header
    .split(";")
    .map((s) => s.trim())
    .reduce((acc, kv) => {
      const [k, v] = kv.split("=");
      if (k) acc[k] = decodeURIComponent(v || "");
      return acc;
    }, {});
}

function getUserFromCookie(req) {
  const cookies = parseCookieCookie(req);
  const userEmail = cookies.user || "";
  if (!userEmail) return null;

  return db
    .prepare("SELECT id, email, username FROM users WHERE email = ?")
    .get(userEmail);
}

function getEventById(eventId) {
  return db
    .prepare("SELECT id, creator_id FROM events WHERE id = ?")
    .get(eventId);
}

// --------------------
// File storage setup
// --------------------

const UPLOAD_ROOT = path.resolve("./uploads/events");

// Ensure root folder exists
fs.mkdirSync(UPLOAD_ROOT, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const eventId = req.params.id;
    const dir = path.join(UPLOAD_ROOT, String(eventId));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const base =
      Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 10);
    cb(null, base + ext);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 10,
  },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  },
});

// --------------------
// Routes
// --------------------

// GET: list resources for an event
router.get("/events/:id/resources", (req, res) => {
  try {
    const eventId = Number(req.params.id);
    if (!Number.isFinite(eventId)) {
      return res.status(400).json({ ok: false, error: "Invalid event id" });
    }

    const rows = db
      .prepare(
        `
        SELECT 
          id, event_id, filename, storage_name, path, mime, size, tag, uploader_id, uploaded_at
        FROM resources
        WHERE event_id = ?
        ORDER BY uploaded_at ASC
      `
      )
      .all(eventId);

    res.json({ ok: true, resources: rows });
  } catch (err) {
    console.error("List resources error:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

// POST: upload resources (creator only)
router.post(
  "/events/:id/resources",
  (req, res, next) => {
    const eventId = Number(req.params.id);
    if (!Number.isFinite(eventId)) {
      return res.status(400).json({ error: "Invalid event id" });
    }

    const user = getUserFromCookie(req);
    const event = getEventById(eventId);

    if (!user || !event) {
      return res.status(401).json({ error: "Not authorized" });
    }

    if (Number(user.id) !== Number(event.creator_id)) {
      return res
        .status(403)
        .json({ error: "Only creator can upload resources" });
    }

    next();
  },
  upload.array("resources", 10),
  (req, res) => {
    try {
      const eventId = Number(req.params.id);
      const user = getUserFromCookie(req);
      const tag = (req.body.tag || "").trim();

      if (!tag) {
        return res.status(400).json({ error: "Tag is required" });
      }

      if (!req.files || !req.files.length) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      const stmt = db.prepare(`
        INSERT INTO resources 
          (event_id, filename, storage_name, path, mime, size, tag, uploader_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const f of req.files) {
        const relPath = path.relative(process.cwd(), f.path);

        stmt.run(
          eventId,
          f.originalname,
          f.filename,
          relPath,
          f.mimetype,
          f.size,
          tag,
          user.id
        );
      }

      res.json({ ok: true, uploaded: req.files.length });
    } catch (err) {
      console.error("Upload resources error:", err);
      res.status(500).json({ ok: false, error: "Upload failed" });
    }
  }
);

// GET: stream or download resource
router.get("/resources/:resourceId/file", (req, res) => {
  try {
    const rid = Number(req.params.resourceId);
    if (!Number.isFinite(rid)) {
      return res.status(400).send("Invalid resource id");
    }

    const row = db
      .prepare(
        `
        SELECT r.path, r.mime, r.filename, e.creator_id, e.group_id
        FROM resources r
        JOIN events e ON r.event_id = e.id
        WHERE r.id = ?
      `
      )
      .get(rid);

    if (!row) return res.status(404).send("Not found");

    // --- Authorization check ---
    const user = getUserFromCookie(req);
    if (!user) return res.status(401).send("Unauthorized");

    // allow creator or any group member to view
    const isMember = db
      .prepare(
        `
        SELECT 1 FROM groupusers 
        WHERE group_id = ? AND user_id = ?
      `
      )
      .get(row.group_id, user.id);

    const isCreator = Number(user.id) === Number(row.creator_id);

    if (!isMember && !isCreator) {
      return res.status(403).send("Forbidden");
    }

    const absPath = path.resolve(row.path);

    res.type(row.mime || "application/octet-stream");

    if (req.query.download) {
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${row.filename || "file"}"`
      );
    }

    const stream = fs.createReadStream(absPath);
    stream.on("error", (err) => {
      console.error("File read error:", err);
      res.status(404).send("File not found");
    });
    stream.pipe(res);
  } catch (err) {
    console.error("Serve resource error:", err);
    res.status(500).send("Server error");
  }
});

export default router;
