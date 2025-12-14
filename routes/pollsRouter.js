import express from "express";
import { db } from "../db.js";
import { getCurrentUser, getIdbyEmail } from "../public/js/getUserInfo.js";

const router = express.Router();

const clients = new Set();

router.get("/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  res.flushHeaders();

  const client = { res };
  clients.add(client);

  req.on("close", () => {
    clients.delete(client);
  });
});

function broadcastPollUpdate(pollId) {
  const data = db
    .prepare(
      `
      SELECT po.id, COUNT(pv.id) AS votes
      FROM poll_options po
      LEFT JOIN poll_votes pv ON pv.poll_option_id = po.id
      WHERE po.poll_id = ?
      GROUP BY po.id
      `
    )
    .all(pollId);

  const payload = JSON.stringify({
    pollId,
    options: data,
  });

  for (const client of clients) {
    client.res.write(`event: pollUpdate\n`);
    client.res.write(`data: ${payload}\n\n`);
  }
}

/**
 * Vote on a poll
 * body: { optionIds: number[] }
 */
router.post("/:pollId/vote", (req, res) => {
  const pollId = Number(req.params.pollId);
  const { optionIds } = req.body;

  // --------------------
  // Auth
  // --------------------
  const email = getCurrentUser(req);
  if (!email) {
    return res.status(401).json({ error: "Not logged in" });
  }

  const userId = getIdbyEmail(db, email);
  if (!userId) {
    return res.status(401).json({ error: "User not found" });
  }

  if (!Array.isArray(optionIds)) {
    return res.status(400).json({ error: "Invalid options" });
  }

  // --------------------
  // Poll
  // --------------------
  const poll = db
    .prepare(
      `
      SELECT id, group_id, allow_multiple, end_time, is_closed
      FROM polls
      WHERE id = ?
      `
    )
    .get(pollId);

  if (!poll) {
    return res.status(404).json({ error: "Poll not found" });
  }

  if (poll.is_closed || (poll.end_time && Date.now() > poll.end_time)) {
    return res.status(400).json({ error: "Poll is closed" });
  }

  // --------------------
  // Role check
  // --------------------
  const membership = db
    .prepare(
      `
      SELECT role
      FROM groupusers
      WHERE group_id = ? AND user_id = ?
      `
    )
    .get(poll.group_id, userId);

  if (!membership) {
    return res.status(403).json({ error: "Not a group member" });
  }

  if (membership.role === "lurker") {
    return res.status(403).json({ error: "Lurkers cannot vote" });
  }

  // --------------------
  // Voting transaction
  // --------------------
  const tx = db.transaction(() => {
    // Single choice → remove all previous votes
    if (!poll.allow_multiple) {
      db.prepare(
        `
        DELETE FROM poll_votes
        WHERE poll_id = ? AND user_id = ?
        `
      ).run(pollId, userId);
    }

    // Remove deselected options
    if (optionIds.length) {
      db.prepare(
        `
        DELETE FROM poll_votes
        WHERE poll_id = ?
          AND user_id = ?
          AND poll_option_id NOT IN (${optionIds.map(() => "?").join(",")})
        `
      ).run(pollId, userId, ...optionIds);
    } else {
      db.prepare(
        `
        DELETE FROM poll_votes
        WHERE poll_id = ? AND user_id = ?
        `
      ).run(pollId, userId);
    }

    // Insert selected options
    const insert = db.prepare(`
      INSERT OR IGNORE INTO poll_votes
        (poll_id, poll_option_id, user_id)
      VALUES (?, ?, ?)
    `);

    optionIds.forEach((optId) => {
      insert.run(pollId, optId, userId);
    });
  });

  tx();

  res.json({ success: true });
  broadcastPollUpdate(pollId);
});

export default router;
