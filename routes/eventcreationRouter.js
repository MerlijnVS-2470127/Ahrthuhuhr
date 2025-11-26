import express from "express";
import { db } from "../db.js"; // pad aanpassen indien nodig
const router = express.Router();

// helper: parse cookie header quickly (server-side)
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

// GET /events/new  -> render creation page with groups filtered for user
router.get("/events/new", (req, res) => {
  const cookies = parseCookieCookie(req);
  const userEmail = cookies.user || ""; // cookie format: user=<email>

  // find user id (if any)
  const userRow = userEmail
    ? db
        .prepare("SELECT id, email, username FROM users WHERE email = ?")
        .get(userEmail)
    : null;
  let groups = [];

  if (userRow) {
    if (userRow.email === "admin") {
      // admin sees all groups
      groups = db.prepare("SELECT id, name FROM groups ORDER BY name").all();
    } else {
      // groups where user is a member
      groups = db
        .prepare(
          `
        SELECT g.id, g.name
        FROM groups g
        JOIN groupusers gu ON gu.group_id = g.id
        WHERE gu.user_id = ?
        ORDER BY g.name
      `
        )
        .all(userRow.id);
    }
  } else {
    // not logged in or unknown user: show no groups (or you may decide to show public groups)
    groups = [];
  }

  // pass creator id (to show in form hidden or not) — we won't trust client, but helpful for UI
  const creator_id = userRow ? userRow.id : null;

  res.render("pages/FS_EventCreation", { groups, creator_id, userEmail });
});

// POST /events/create  -> server-side uses cookie to get creator id
router.post("/events/create", (req, res) => {
  try {
    const {
      title,
      description,
      location,
      start_time,
      end_time,
      lat,
      lng,
      group_id,
    } = req.body;

    // server-side validation
    if (!title || !location || !start_time || !group_id)
      return res.status(400).json({ error: "missing fields" });

    // find creator id from cookie
    const cookies = parseCookieCookie(req);
    const userEmail = cookies.user || "";
    let creatorId = null;
    if (userEmail) {
      const u = db
        .prepare("SELECT id FROM users WHERE email = ?")
        .get(userEmail);
      if (u) creatorId = u.id;
    }
    // if still null, optionally set to default or reject
    if (creatorId === null) {
      // optional: require login; for now reject
      return res.status(401).json({ error: "not authenticated" });
    }

    const startMs = Number(start_time);
    if (!Number.isFinite(startMs) || startMs < Date.now())
      return res.status(400).json({ error: "invalid start_time" });

    let endMs = null;
    if (end_time) {
      endMs = Number(end_time);
      if (!Number.isFinite(endMs) || endMs <= startMs)
        return res.status(400).json({ error: "invalid end_time" });
    }

    // lat/lng rule
    const hasLat = lat !== undefined && lat !== null && lat !== "";
    const hasLng = lng !== undefined && lng !== null && lng !== "";
    if (hasLat !== hasLng)
      return res
        .status(400)
        .json({ error: "lat and lng must both be present or both absent" });
    let latNum = null,
      lngNum = null;
    if (hasLat && hasLng) {
      latNum = Number(lat);
      lngNum = Number(lng);
      if (!Number.isFinite(latNum) || latNum < -90 || latNum > 90)
        return res.status(400).json({ error: "invalid lat" });
      if (!Number.isFinite(lngNum) || lngNum < -180 || lngNum > 180)
        return res.status(400).json({ error: "invalid lng" });
    }

    // ensure group_id is a group the user may post to (admin or member)
    const gidNum = Number(group_id);
    if (!Number.isFinite(gidNum))
      return res.status(400).json({ error: "invalid group" });

    // check membership or admin
    const userRow = db
      .prepare("SELECT id, email FROM users WHERE id = ?")
      .get(creatorId);
    if (!userRow) return res.status(401).json({ error: "invalid user" });

    if (userRow.email !== "admin") {
      const member = db
        .prepare("SELECT 1 FROM groupusers WHERE group_id = ? AND user_id = ?")
        .get(gidNum, creatorId);
      if (!member)
        return res
          .status(403)
          .json({ error: "not a member of the selected group" });
    } else {
      // admin ok
    }

    const insert = db.prepare(`
      INSERT INTO events (creator_id, group_id, title, description, start_time, end_time, status, location, location_lat, location_lng)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = insert.run(
      creatorId,
      gidNum,
      title,
      description || null,
      startMs,
      endMs,
      "planned",
      location || null,
      latNum,
      lngNum
    );

    return res.status(201).json({ id: info.lastInsertRowid });
  } catch (err) {
    console.error("create event error", err);
    return res.status(500).json({ error: "server error" });
  }
});

export default router;
