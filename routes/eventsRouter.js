import express from "express";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import { db } from "../db.js";
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

// Event creation routers
// GET /events/new  -> render creation page with groups filtered for user
router.get("/events/new", (req, res) => {
  const cookies = parseCookieCookie(req);
  const userEmail = cookies.user || "";

  const userRow = userEmail
    ? db
        .prepare("SELECT id, email, username FROM users WHERE email = ?")
        .get(userEmail)
    : null;

  let groups = [];

  if (userRow) {
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
      .all(userRow.id)
      .map((g) => ({ id: g.id, name: g.name }));
  } else {
    groups = [];
  }

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
    const member = db
      .prepare("SELECT 1 FROM groupusers WHERE group_id = ? AND user_id = ?")
      .get(gidNum, creatorId);

    if (!member) {
      return res
        .status(403)
        .json({ error: "not a member of the selected group" });
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

//Event view routings
// POST /events/:id/attendance
router.post("/events/:id/attendance", (req, res) => {
  const eventId = Number(req.params.id);
  if (!Number.isFinite(eventId)) return res.status(400).send("invalid id");
  try {
    // simple cookie parser function already in file: parseCookieCookie(req)
    const cookies = parseCookieCookie(req);
    const userEmail = cookies.user || "";
    if (!userEmail) return res.status(401).json({ error: "not authenticated" });

    const userRow = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(userEmail);
    if (!userRow) return res.status(401).json({ error: "invalid user" });
    const userId = userRow.id;

    const eventId = Number(req.params.id);
    if (!Number.isFinite(eventId))
      return res.status(400).json({ error: "invalid id" });

    const status = String(req.body.status || "").trim();
    if (!["going", "interested", "declined"].includes(status))
      return res.status(400).json({ error: "invalid status" });

    // Upsert into eventusers (better-sqlite3: try update, then insert)
    const update = db.prepare(
      `UPDATE eventusers SET status = ?, joined_at = ? WHERE event_id = ? AND user_id = ?`
    );
    const now = Date.now();
    const ures = update.run(status, now, eventId, userId);
    if (ures.changes === 0) {
      const insert = db.prepare(
        `INSERT INTO eventusers (event_id, user_id, status, joined_at) VALUES (?, ?, ?, ?)`
      );
      insert.run(eventId, userId, status, now);
    }

    return res.json({ ok: true, status });
  } catch (err) {
    console.error("attendance error", err);
    return res.status(500).json({ error: "server error" });
  }
});

// GET /events/:id/attendees
router.get("/events/:id/attendees", (req, res) => {
  const eventId = Number(req.params.id);
  if (!Number.isFinite(eventId)) return res.status(400).send("invalid id");
  try {
    const eventId = Number(req.params.id);
    if (!Number.isFinite(eventId))
      return res.status(400).json({ error: "invalid id" });

    const rows = db
      .prepare(
        `SELECT eu.user_id, u.username, eu.status, eu.joined_at
       FROM eventusers eu
       JOIN users u ON u.id = eu.user_id
       WHERE eu.event_id = ?
       ORDER BY eu.joined_at ASC`
      )
      .all(eventId);

    return res.json({ ok: true, attendees: rows });
  } catch (err) {
    console.error("attendees error", err);
    return res.status(500).json({ error: "server error" });
  }
});

// Download Event PDF
router.get("/events/:id/pdf", (req, res) => {
  try {
    const eventId = Number(req.params.id);
    if (!Number.isFinite(eventId)) {
      return res.status(400).send("Invalid event id");
    }

    // --- Get event with creator + group ---
    const event = db
      .prepare(
        `
        SELECT 
          e.*,
          g.name AS group_name,
          u.username AS creator_name
        FROM events e
        LEFT JOIN groups g ON e.group_id = g.id
        LEFT JOIN users u ON e.creator_id = u.id
        WHERE e.id = ?
      `
      )
      .get(eventId);

    if (!event) return res.status(404).send("Event not found");

    const cookies = parseCookieCookie(req);
    const userEmail = cookies.user || "";
    const userRow = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(userEmail);

    const membership = db
      .prepare("SELECT 1 FROM groupusers WHERE group_id = ? AND user_id = ?")
      .get(event.group_id, userRow.id);

    // deny pdf download if not in group
    if (!membership) {
      return res.status(403).send("Forbidden");
    }

    // --- Get resources ---
    const resources = db
      .prepare(
        `
        SELECT id, filename, path, tag
        FROM resources
        WHERE event_id = ?
        ORDER BY uploaded_at ASC
      `
      )
      .all(eventId);

    // --- Create PDF ---
    const doc = new PDFDocument({ autoFirstPage: true });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="event-${eventId}.pdf"`
    );

    doc.pipe(res);

    // ---- Title ----
    doc.fontSize(26).text(event.title, { align: "center" });
    doc.moveDown();

    doc.fontSize(14).text(`Group: ${event.group_name || "-"}`);
    doc.text(`Created by: ${event.creator_name || "-"}`);
    doc.text(
      `Date: ${new Date(Number(event.start_time)).toLocaleString("en-GB")}`
    );
    if (event.end_time) {
      doc.text(
        `End: ${new Date(Number(event.end_time)).toLocaleString("en-GB")}`
      );
    }
    doc.text(`Location: ${event.location || "-"}`);
    doc.moveDown();

    // ---- Description ----
    if (event.description) {
      doc.fontSize(16).text("Description", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12).text(event.description);
      doc.moveDown();
    }

    // ---- Resources Section ----
    if (resources.length > 0) {
      doc.addPage();
      doc.fontSize(18).text("Resources", { underline: true });
      doc.moveDown();

      for (const r of resources) {
        doc.fontSize(12).text(`• ${r.tag || r.filename}`);
        doc.moveDown(0.25);

        const absPath = path.resolve(r.path);

        if (fs.existsSync(absPath)) {
          try {
            doc.image(absPath, {
              fit: [450, 300],
              align: "center",
            });
            doc.moveDown();
          } catch (e) {
            doc.text("[Image could not be embedded]");
            doc.moveDown();
          }
        } else {
          doc.text("[Image file missing]");
          doc.moveDown();
        }

        doc.moveDown();
      }
    }

    doc.end();
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).send("Failed to generate PDF");
  }
});

// post event modifications through edit modal
router.post("/events/:id/edit", (req, res) => {
  try {
    const eventId = Number(req.params.id);
    if (!Number.isFinite(eventId)) {
      return res.status(400).json({ error: "Invalid event id" });
    }

    const cookies = parseCookieCookie(req);
    const userEmail = cookies.user || "";
    const user = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(userEmail);

    if (!user) {
      return res.status(401).json({ error: "Not logged in" });
    }

    const event = db.prepare("SELECT * FROM events WHERE id = ?").get(eventId);

    if (!event || Number(event.creator_id) !== Number(user.id)) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const {
      title,
      location,
      description,
      lat,
      lng,
      startDate,
      startTime,
      endDate,
      endTime,
    } = req.body;

    const updates = {};
    const params = [];

    if (title) {
      updates.title = title;
    }
    if (location) {
      updates.location = location;
    }
    if (description !== undefined) {
      updates.description = description;
    }

    // Parse dates
    let startMs = null;
    let endMs = null;

    if (startDate && startTime) {
      startMs = Date.parse(`${startDate}T${startTime}`);

      console.log("look at this, punk: ", startMs, event.start_time);

      if (startMs != event.start_time && startMs < Date.now()) {
        return res
          .status(400)
          .json({ error: "Start time cannot be in the past" });
      }
      updates.start_time = startMs;
    }

    if (endDate) {
      endMs = Date.parse(`${endDate}T${endTime || "00:00"}`);
      if (startMs && endMs <= startMs) {
        return res.status(400).json({ error: "End must be after start" });
      }
      updates.end_time = endMs;
    }

    // Coordinates
    const latNum = lat !== "" ? Number(lat) : null;
    const lngNum = lng !== "" ? Number(lng) : null;

    if (
      latNum !== null &&
      (!Number.isFinite(latNum) || latNum < -90 || latNum > 90)
    ) {
      return res.status(400).json({ error: "Invalid latitude" });
    }
    if (
      lngNum !== null &&
      (!Number.isFinite(lngNum) || lngNum < -180 || lngNum > 180)
    ) {
      return res.status(400).json({ error: "Invalid longitude" });
    }

    if (latNum !== null) updates.location_lat = latNum;
    if (lngNum !== null) updates.location_lng = lngNum;

    // ---- Auto update status ----
    if (startMs || endMs) {
      const now = Date.now();
      const finalStart = startMs || event.start_time;
      const finalEnd = endMs ?? event.end_time;

      let status = "planned";
      if (finalEnd && now > finalEnd) status = "ended";
      else if (now >= finalStart && (!finalEnd || now <= finalEnd))
        status = "happening now";

      updates.status = status;
    }

    // ---- Save ----
    const keys = Object.keys(updates);
    if (keys.length === 0) {
      return res.json({ ok: true, message: "Nothing to update" });
    }

    const setClause = keys.map((k) => `${k} = ?`).join(", ");
    const values = keys.map((k) => updates[k]);

    db.prepare(`UPDATE events SET ${setClause} WHERE id = ?`).run(
      ...values,
      eventId
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("Edit event error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /events/:id/cancel
router.post("/events/:id/cancel", (req, res) => {
  try {
    const eventId = Number(req.params.id);
    if (!Number.isFinite(eventId))
      return res.status(400).json({ error: "Invalid event id" });

    // get user from cookie
    const cookies = parseCookieCookie(req);
    const userEmail = cookies.user || "";
    const user = userEmail
      ? db.prepare("SELECT id FROM users WHERE email = ?").get(userEmail)
      : null;
    if (!user) return res.status(401).json({ error: "Not logged in" });

    // load event
    const ev = db
      .prepare("SELECT id, creator_id, status FROM events WHERE id = ?")
      .get(eventId);
    if (!ev) return res.status(404).json({ error: "Event not found" });

    // only creator can cancel
    if (Number(user.id) !== Number(ev.creator_id))
      return res.status(403).json({ error: "Forbidden" });

    // if already cancelled, no-op
    if (ev.status === "cancelled") {
      return res.json({ ok: true, message: "Already cancelled" });
    }

    // begin transaction to ensure atomicity
    const tx = db.transaction(() => {
      // set status to cancelled
      db.prepare("UPDATE events SET status = ? WHERE id = ?").run(
        "cancelled",
        eventId
      );

      // delete all eventusers rows for this event
      db.prepare("DELETE FROM eventusers WHERE event_id = ?").run(eventId);
    });

    tx();

    res.json({ ok: true });
  } catch (err) {
    console.error("Cancel event error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// POST /events/:id/delete
router.post("/events/:id/delete", (req, res) => {
  try {
    const eventId = Number(req.params.id);
    if (!Number.isFinite(eventId))
      return res.status(400).json({ error: "Invalid event id" });

    // get user from cookie
    const cookies = parseCookieCookie(req);
    const userEmail = cookies.user || "";
    const user = userEmail
      ? db.prepare("SELECT id FROM users WHERE email = ?").get(userEmail)
      : null;
    if (!user) return res.status(401).json({ error: "Not logged in" });

    // load event
    const ev = db
      .prepare("SELECT id, creator_id FROM events WHERE id = ?")
      .get(eventId);
    if (!ev) return res.status(404).json({ error: "Event not found" });

    // only creator can delete
    if (Number(user.id) !== Number(ev.creator_id))
      return res.status(403).json({ error: "Forbidden" });

    // fetch resources for this event (to delete files)
    const resources = db
      .prepare("SELECT id, path FROM resources WHERE event_id = ?")
      .all(eventId);

    // transaction: delete DB rows (event), remove files afterwards (but do file deletes inside transaction? we do DB delete in tx and then attempt to remove files - do file deletes before or after?)
    // We'll delete files first (best-effort), then delete DB rows in a transaction.
    for (const r of resources) {
      try {
        const abs = path.resolve(r.path);
        if (fs.existsSync(abs)) {
          fs.unlinkSync(abs);
        }
      } catch (err) {
        // log and continue — file system cleanup is best-effort
        console.error("Failed to unlink resource file:", r.path, err);
      }
    }

    // attempt to remove directory for event (best-effort)
    try {
      const eventDir = path.resolve(`./uploads/events/${eventId}`);
      if (fs.existsSync(eventDir)) {
        // remove files if any leftover, then rmdir
        fs.rmSync(eventDir, { recursive: true, force: true });
      }
    } catch (err) {
      console.error("Failed to remove event upload dir:", err);
    }

    // Now remove DB rows (event + cascades). Use a transaction for safety.
    const tx = db.transaction(() => {
      // Delete resources rows explicitly if your resources table does not have ON DELETE CASCADE.
      db.prepare("DELETE FROM resources WHERE event_id = ?").run(eventId);

      // Delete the event row (this will cascade to eventusers if ON DELETE CASCADE is set)
      db.prepare("DELETE FROM events WHERE id = ?").run(eventId);
    });
    tx();

    res.json({ ok: true });
  } catch (err) {
    console.error("Delete event error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
