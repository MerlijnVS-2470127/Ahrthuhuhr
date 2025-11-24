import express from "express";
import { db } from "../db.js";
const router = express.Router();

// ---------------------------
// API: get messages
// ---------------------------
router.get("/groups/:groupId/messages", (req, res) => {
  const groupId = req.params.groupId;
  const since = parseInt(req.query.since || "0", 10);

  if (since > 0) {
    const rows = db
      .prepare(
        `SELECT id, group_id, user_name, content, created_at FROM messages WHERE group_id = ? AND created_at > ? ORDER BY created_at ASC`
      )
      .all(groupId, since);
    res.json(rows);
  } else {
    const rows = db
      .prepare(
        `SELECT id, group_id, user_name, content, created_at FROM messages WHERE group_id = ? ORDER BY created_at ASC`
      )
      .all(groupId);
    res.json(rows);
  }
});

// ---------------------------
// API: post a new message
// ---------------------------
router.post("/groups/:groupId/messages", (req, res) => {
  const groupId = req.params.groupId;
  const user_name =
    (req.body.user_name && String(req.body.user_name).slice(0, 50)) ||
    "Anonymous";
  const content =
    (req.body.content && String(req.body.content).slice(0, 2000)) || "";

  if (!content.trim()) {
    return res.status(400).json({ error: "Message content required" });
  }

  const created_at = Date.now();
  const info = db
    .prepare(
      `INSERT INTO messages (group_id, user_name, content, created_at) VALUES (?, ?, ?, ?)`
    )
    .run(groupId, user_name, content, created_at);

  res.status(201).json({
    id: info.lastInsertRowid,
    group_id: groupId,
    user_name,
    content,
    created_at,
  });
});

export default router;
