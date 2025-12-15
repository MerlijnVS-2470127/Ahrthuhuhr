import express from "express";
import { db } from "../db.js";
import { getCurrentUser, getIdbyEmail } from "../public/js/getUserInfo.js";

const router = express.Router();

const clients = new Set();

//keep votes per option up to date
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
 * Post vote on a poll
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

// post created poll
router.post("/:groupId", (req, res) => {
  const groupId = Number(req.params.groupId);

  const email = getCurrentUser(req);
  if (!email) return res.sendStatus(401);

  // Convert email → user row
  const user = db.prepare("SELECT id FROM users WHERE email = ?").get(email);

  if (!user) return res.sendStatus(401);

  // Role check
  const roleRow = db
    .prepare(
      `
      SELECT role
      FROM groupusers
      WHERE group_id = ? AND user_id = ?
      `
    )
    .get(groupId, user.id);

  if (!roleRow || roleRow.role === "lurker") {
    return res.sendStatus(403);
  }

  const { title, allow_multiple, end_time, options } = req.body;

  if (!title || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ error: "Invalid poll data" });
  }

  // insert poll
  const pollResult = db
    .prepare(
      `
      INSERT INTO polls (group_id, creator_id, title, allow_multiple, end_time)
      VALUES (?, ?, ?, ?, ?)
    `
    )
    .run(groupId, user.id, title, allow_multiple ? 1 : 0, end_time || null);

  const pollId = pollResult.lastInsertRowid;

  // insert options
  const insertOption = db.prepare(
    `
    INSERT INTO poll_options (poll_id, title, description)
    VALUES (?, ?, ?)
  `
  );

  const tx = db.transaction(() => {
    options.forEach((opt) => {
      insertOption.run(pollId, opt.title, opt.description || "");
    });
  });

  tx();

  // optionally: broadcast new poll via SSE to all group members

  res.status(201).json({ success: true, pollId });
});

export default router;
