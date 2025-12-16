import express from "express";
import { db } from "./db.js";
import {
  isAuthorized,
  goToLogin,
  checkCredentails,
  checkEmailAvailability,
  checkInputValidity,
  createNewAccount,
} from "./public/js/authenticate.js";
import { changeData, checkUsername } from "./public/js/profileModification.js";
import {
  getGroupData,
  formatToEncodedString,
} from "./public/js/groupModule.js";
import {
  getIdbyEmail,
  getCurrentUser,
  getCookieByName,
  getCurrentUsername,
} from "./public/js/getUserInfo.js";
import cookieParser from "cookie-parser";
import session from "express-session";

const views = express();
views.use(cookieParser());

//------------------//
// Home page render //
//------------------//
views.get("/", (request, response) => {
  if (isAuthorized(request, db)) {
    const userEmail = getCurrentUser(request);

    let username = getCurrentUsername(db, userEmail);

    //loading in events
    try {
      // find user row (if any)
      const userRow = userEmail
        ? db
            .prepare("SELECT id, email, username FROM users WHERE email = ?")
            .get(userEmail)
        : null;

      // fetch groups where user is a member
      const userGroups = db
        .prepare(
          `SELECT g.id, g.name
       FROM groups g
       JOIN groupusers gu ON gu.group_id = g.id
       WHERE gu.user_id = ?
       ORDER BY g.name`
        )
        .all(userRow.id);

      const groupIds = userGroups.map((g) => g.id);

      // fetch events for those groups, join group name, order by start_time
      const rows = db
        .prepare(
          `
  SELECT e.*, g.name AS group_name
  FROM events e
  LEFT JOIN groups g ON e.group_id = g.id
  WHERE e.group_id IN (${groupIds.map(() => "?").join(",")})
  ORDER BY
    e.start_time ASC,
    CASE WHEN e.end_time IS NULL THEN 1 ELSE 0 END ASC,
    e.end_time ASC,
    e.id ASC
`
        )
        .all(...groupIds);

      // map rows -> view-friendly objects
      const events = rows.map((ev) => {
        const startMs = ev.start_time ? Number(ev.start_time) : null;
        const endMs = ev.end_time ? Number(ev.end_time) : null;

        const start = startMs
          ? new Date(startMs).toLocaleString("en-GB", {
              dateStyle: "medium",
              timeStyle: "short",
              hour12: false,
            })
          : "TBD";
        const end = endMs
          ? new Date(endMs).toLocaleString("en-GB", {
              dateStyle: "medium",
              timeStyle: "short",
              hour12: false,
            })
          : "";

        const locationText = ev.location || ev.group_name || "—";

        const lat = ev.location_lat != null ? Number(ev.location_lat) : null;
        const lng = ev.location_lng != null ? Number(ev.location_lng) : null;

        return {
          id: ev.id,
          title: ev.title,
          description: ev.description,
          start,
          end,
          status: ev.status,
          location: locationText,
          lat,
          lng,
          group_id: ev.group_id,
          group_name: ev.group_name,
        };
      });

      //groups
      const userId = getIdbyEmail(db, userEmail);

      const groupRows = db
        .prepare(
          `SELECT g.id, g.name, g.description
       FROM groups g
       JOIN groupusers gu ON gu.group_id = g.id
       WHERE gu.user_id = ?
       ORDER BY g.name`
        )
        .all(userId);

      const groups = groupRows.map((gr) => {
        return {
          id: gr.id,
          name: gr.name,
          description: gr.description,
        };
      });

      response.render("pages/FS_Home", {
        username,
        groups,
        events,
        userGroups,
      });
    } catch (err) {
      console.error("Error rendering homepage", err);
      response.status(500).send("Server error");
    }
  } else {
    goToLogin(request, response);
  }
});

//-----------------//
// FAQ page render //
//-----------------//
views.get("/faq", (request, response) => {
  if (isAuthorized(request, db)) {
    response.render("pages/FS_FAQ");
  } else {
    goToLogin(request, response);
  }
});

//-------------------//
// Login page render //
//-------------------//
views.get("/login", (request, response) => {
  goToLogin(request, response);
});

views.get("/login/:email/:password/:mode", (request, response) => {
  const email = decodeURIComponent(request.params.email);
  const password = decodeURIComponent(request.params.password);
  const mode = decodeURIComponent(request.params.mode);

  console.log(
    "Verkregen waarden van login pagina:   email: " +
      email +
      "  password: " +
      password +
      " mode: " +
      mode
  );

  let credentialValidity;

  if (mode === "login") {
    credentialValidity = checkCredentails(email, password, db);

    response.render("pages/FS_Login", {
      email: email,
      credentialValidity: credentialValidity,
      mode: "login",
    });
  } else {
    credentialValidity = checkEmailAvailability(email, db);

    if (credentialValidity === "true") {
      if (checkInputValidity(email, password)) {
        console.log("Nieuw account wordt aangemaakt met email: " + email);
        createNewAccount(db, email, password); //username toe te voegen
      }
    }

    response.render("pages/FS_Login", {
      email: email,
      credentialValidity: credentialValidity,
      mode: "create",
    });
  }
});

//--------------------------//
// Edit Profile page render //
//--------------------------//
views.get("/profile", (request, response) => {
  if (isAuthorized(request, db)) {
    const email = getCurrentUser(request);
    const currentUsername = getCurrentUsername(db, email);

    response.render("pages/FS_Profile", {
      changeStatus: true,
      email: email,
      currentUsername: currentUsername,
    });
  } else {
    goToLogin(request, response);
  }
});

views.get("/profile/:data/:changed/:email", (request, response) => {
  let changed = decodeURIComponent(request.params.changed);
  let data = decodeURIComponent(request.params.data);
  let email = decodeURIComponent(request.params.email);

  let changeStatus = true;
  let currentUsername = "error loading username";

  console.log(
    "----------------------- data: " +
      data +
      "----------------------- email: " +
      email
  );

  if (isAuthorized(request, db)) {
    if (changed != "null" && data != "null") {
      changeStatus = changeData(request, response, db, data, changed, email);
    }

    if (changeStatus) {
      currentUsername = getCurrentUsername(db, email);
    }

    console.log("----------------------- currentUsername: " + currentUsername);

    response.render("pages/FS_Profile", {
      changeStatus: changeStatus,
      email: email,
      currentUsername: currentUsername,
    });
  } else {
    goToLogin(request, response);
  }
});

//-----------------//
// Map page render //
//-----------------//

views.get("/map", (request, response) => {
  response.render("pages/FS_Map");
});

//---------------------//
// groups pages render //
//---------------------//

//general group page
views.get("/groups", (request, response) => {
  let email = getCurrentUser(request);

  let IDs = getGroupData(db, email, "id");
  let names = getGroupData(db, email, "name");
  let descriptions = getGroupData(db, email, "description");

  IDs = formatToEncodedString(IDs);
  names = formatToEncodedString(names);
  descriptions = formatToEncodedString(descriptions);

  response.render("pages/FS_Groups", {
    ids: IDs,
    names: names,
    descriptions: descriptions,
  });
});

//group creation page
views.get("/groups/create", (request, response) => {
  if (isAuthorized(request, db)) {
    let message = false;
    response.render("pages/FS_GroupCreation", {
      message: message,
    });
  } else {
    goToLogin(request, response);
  }
});

views.get("/groups/create/:name/:description", (request, response) => {
  if (isAuthorized(request, db)) {
    let email = getCurrentUser(request, db);
    const name = decodeURIComponent(request.params.name);
    let description = decodeURIComponent(request.params.description);

    if (description === "null") {
      description = "";
    }

    let owner_id = getIdbyEmail(db, email);

    let newGroup = db
      .prepare(
        `INSERT INTO groups (owner_id, name, description) VALUES (?, ?, ?)`
      )
      .run(owner_id, name, description);

    const newGroup_ids = db
      .prepare(
        `SELECT id FROM groups WHERE owner_id = ? AND name = ? AND description = ?`
      )
      .all(owner_id, name, description);

    let newGroup_id = newGroup_ids[newGroup_ids.length - 1].id;

    newGroup = db
      .prepare(
        `INSERT INTO groupusers (group_id, user_id, role) VALUES (?, ?, ?)`
      )
      .run(newGroup_id, owner_id, "owner");

    let message = true;

    response.render("pages/FS_GroupCreation", {
      message: message,
    });
  } else {
    goToLogin(request, response);
  }
});

//group leaving
views.get("/groups/:groupId/leave", (request, response) => {
  const groupId = request.params.groupId;
  const email = getCurrentUser(request);
  const userId = getIdbyEmail(db, email);

  const remove = db
    .prepare(`DELETE FROM groupusers WHERE (group_id = ?) AND (user_id = ?)`)
    .run(groupId, userId);

  response.redirect("/groups");
});

//group deletion
views.get("/groups/:groupId/delete", (request, response) => {
  const groupId = request.params.groupId;
  const email = getCurrentUser(request);
  const userId = getIdbyEmail(db, email);

  console.log(
    "---------------- groupId = " +
      groupId +
      " email = " +
      email +
      " Userid = " +
      userId +
      "-----------"
  );

  const userRole = db
    .prepare(
      `SELECT role
       FROM groupusers 
       WHERE user_id = ? AND group_id = ?`
    )
    .get(userId, groupId);

  console.log("---------------- userRole = " + userRole.role + "-----------");

  //persoon moet owner zijn => check groupowner van groupusers, => check of email hetzelfde is
  //aan te passen
  if (userRole.role === "owner") {
    const remove = db
      .prepare(`DELETE FROM groups WHERE (id = ?) AND (owner_id = ?)`)
      .run(groupId, userId);
  }

  response.redirect("/groups");
});

//chatpagina per groep
views.get("/groups/:groupId", (request, response) => {
  const groupId = Math.floor(request.params.groupId);

  //berichten van groep ophalen
  const messages = db
    .prepare(
      `SELECT id, group_id, user_name, content, created_at FROM messages WHERE group_id = ? ORDER BY created_at ASC`
    )
    .all(groupId);

  //info van groep ophalen
  const group = db
    .prepare(`SELECT id, owner_id, name, description FROM groups WHERE id = ?`)
    .get(groupId);

  //info van events ophalen
  const rows = db
    .prepare(
      `SELECT id, creator_id, title, description, start_time, end_time, status, location, location_lat, location_lng FROM events WHERE group_id = ?`
    )
    .all(groupId);

  const events = rows.map((ev) => {
    const startMs = ev.start_time ? Number(ev.start_time) : null;
    const endMs = ev.end_time ? Number(ev.end_time) : null;

    const start = startMs
      ? new Date(startMs).toLocaleString("en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
          hour12: false,
        })
      : "TBD";
    const end = endMs
      ? new Date(endMs).toLocaleString("en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
          hour12: false,
        })
      : "";

    const locationText = ev.location || ev.group_name || "—";

    return {
      id: ev.id,
      title: ev.title,
      description: ev.description,
      start,
      end,
      status: ev.status,
      location: locationText,
    };
  });

  //status van de users ophalen
  const userStatus = db
    .prepare(`SELECT user_id, role FROM groupusers WHERE group_id = ?`)
    .all(groupId);

  const userInfo = userStatus.map((u) => {
    //info van de users ophalen
    const user = db
      .prepare(`SELECT email, username FROM users WHERE id = ?`)
      .get(u.user_id);

    return {
      id: u.user_id,
      email: user.email,
      username: user.username,
      role: u.role,
    };
  });

  const currentUser = getCurrentUser(request);

  // polls van groep ophalen
  const pollsRows = db
    .prepare(
      `SELECT p.id, p.title, p.end_time, p.creator_id, p.allow_multiple, u.username AS creator
     FROM polls p
     LEFT JOIN users u ON u.id = p.creator_id
     WHERE p.group_id = ?
     ORDER BY p.created_at DESC`
    )
    .all(groupId);

  // poll options & poll votes van groep ophalen
  const currentUserEmail = getCurrentUser(request);
  const currentUserId = currentUserEmail
    ? getIdbyEmail(db, currentUserEmail)
    : null;

  const polls = pollsRows.map((poll) => {
    const options = db
      .prepare(
        `
      SELECT 
        po.id,
        po.title,
        po.description,
        COUNT(pv.id) AS votes,
        MAX(CASE WHEN pv.user_id = ? THEN 1 ELSE 0 END) AS voted_by_me
      FROM poll_options po
      LEFT JOIN poll_votes pv ON pv.poll_option_id = po.id
      WHERE po.poll_id = ?
      GROUP BY po.id
      `
      )
      .all(currentUserId, poll.id)
      .map((opt) => ({
        ...opt,
        voted_by_me: Boolean(opt.voted_by_me), // normalize
      }));

    return {
      id: poll.id,
      title: poll.title,
      end_time: poll.end_time,
      creator: poll.creator,
      allow_multiple: Number(poll.allow_multiple) === 1,
      options,
    };
  });

  response.render("pages/FS_Groupchat", {
    currentUser,
    groupId,
    messages,
    group,
    events,
    userInfo,
    polls,
  });
});

views.get("/groups/:groupId/editRole/:member/:role/", (request, response) => {
  const groupId = request.params.groupId;
  const member = request.params.member;
  const newRole = request.params.role;

  if (newRole === "admin" || newRole === "member" || newRole === "lurker") {
    if (member) {
      const newGroupuser = db
        .prepare(`UPDATE groupusers SET role=? WHERE group_id=? AND user_id=?`)
        .run(newRole, groupId, member);
    }
  }

  if (newRole === "kick") {
    const remove = db
      .prepare(`DELETE FROM groupusers WHERE (group_id = ?) AND (user_id = ?)`)
      .run(groupId, member);
  }

  response.redirect("/groups/" + groupId + "/");
});

views.get("/groups/:groupId/newMember/:member", (request, response) => {
  const groupId = request.params.groupId;
  const newMember = request.params.member;

  const newMemberId = getIdbyEmail(db, newMember);

  if (newMemberId) {
    //als de user bestaat
    const userExists = db
      .prepare(
        `SELECT user_id FROM groupusers WHERE group_id = ? AND user_id = ?`
      )
      .get(groupId, newMemberId);

    if (!userExists) {
      //als de user niet in de groep zit
      const newGroupuser = db
        .prepare(
          `INSERT INTO groupusers (group_id, user_id, role) VALUES (?, ?, ?)`
        )
        .run(groupId, newMemberId, "member");
    }
  }

  response.redirect("/groups/" + groupId);
});

//---------------------//
// Events pages render //
//---------------------//

//algemene events pagina
views.get("/events", (request, response) => {
  try {
    // quick cookie parse (request.cookies exists because views.use(cookieParser()))
    const userEmail =
      request.cookies && request.cookies.user ? request.cookies.user : "";

    // find user row (if any)
    const userRow = userEmail
      ? db
          .prepare("SELECT id, email, username FROM users WHERE email = ?")
          .get(userEmail)
      : null;

    // if no logged-in user: return empty list and no groups
    if (!userRow) {
      return response.render("pages/FS_Events", { events: [], userGroups: [] });
    }

    // fetch groups where user is a member
    const userGroups = db
      .prepare(
        `SELECT g.id, g.name
       FROM groups g
       JOIN groupusers gu ON gu.group_id = g.id
       WHERE gu.user_id = ?
       ORDER BY g.name`
      )
      .all(userRow.id);

    const groupIds = userGroups.map((g) => g.id);
    if (groupIds.length === 0) {
      return response.render("pages/FS_Events", { events: [], userGroups });
    }

    // fetch events for those groups, join group name, order by start_time
    const rows = db
      .prepare(
        `
  SELECT e.*, g.name AS group_name
  FROM events e
  LEFT JOIN groups g ON e.group_id = g.id
  WHERE e.group_id IN (${groupIds.map(() => "?").join(",")})
  ORDER BY
    e.start_time ASC,
    CASE WHEN e.end_time IS NULL THEN 1 ELSE 0 END ASC,
    e.end_time ASC,
    e.id ASC
`
      )
      .all(...groupIds);

    // map rows -> view-friendly objects
    const events = rows.map((ev) => {
      const startMs = ev.start_time ? Number(ev.start_time) : null;
      const endMs = ev.end_time ? Number(ev.end_time) : null;

      const start = startMs
        ? new Date(startMs).toLocaleString("en-GB", {
            dateStyle: "medium",
            timeStyle: "short",
            hour12: false,
          })
        : "TBD";
      const end = endMs
        ? new Date(endMs).toLocaleString("en-GB", {
            dateStyle: "medium",
            timeStyle: "short",
            hour12: false,
          })
        : "";

      const locationText = ev.location || ev.group_name || "—";

      const lat = ev.location_lat != null ? Number(ev.location_lat) : null;
      const lng = ev.location_lng != null ? Number(ev.location_lng) : null;

      return {
        id: ev.id,
        title: ev.title,
        description: ev.description,
        start,
        end,
        status: ev.status,
        location: locationText,
        lat,
        lng,
        group_id: ev.group_id,
        group_name: ev.group_name,
      };
    });

    response.render("pages/FS_Events", { events, userGroups });
  } catch (err) {
    console.error("Error rendering events page", err);
    response.status(500).send("Server error");
  }
});

//eventcreation pagina
views.get("/events/eventcreation", (request, response) => {
  response.redirect("/events/new");
});

//Shippy pagina
views.get("/shippy", (request, response) => {
  response.redirect("/events/shippy");
});

views.get("/events/shippy", (request, response) => {
  response.render("pages/FS_Shippy.ejs");
});

//event view pagina per event
views.get("/events/:id", (req, res, next) => {
  if (!/^\d+$/.test(String(req.params.id))) return next();
  const eventId = Number(req.params.id);
  if (!Number.isFinite(eventId)) return res.status(400).send("invalid id");

  try {
    // --- get user from cookie ---
    const cookies = req.cookies || {};
    const userEmail = cookies.user || "";
    const userRow = userEmail
      ? db
          .prepare("SELECT id, email, username FROM users WHERE email = ?")
          .get(userEmail)
      : null;

    if (!userRow) {
      return res.redirect("/events");
    }

    const userId = userRow.id;

    // --- get event + group ---
    const evRow = db
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

    if (!evRow) return res.status(404).send("Event not found");

    // --- check group membership ---
    const isMember = db
      .prepare(
        `
        SELECT 1 FROM groupusers 
        WHERE group_id = ? AND user_id = ?
      `
      )
      .get(evRow.group_id, userId);

    if (!isMember) {
      // user not part of this group
      return res.redirect("/events");
    }

    // --- format dates ---
    const startMs = evRow.start_time ? Number(evRow.start_time) : null;
    const endMs = evRow.end_time ? Number(evRow.end_time) : null;

    const start = startMs
      ? new Date(startMs).toLocaleString("en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
          hour12: false,
        })
      : "TBD";
    const end = endMs
      ? new Date(endMs).toLocaleString("en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
          hour12: false,
        })
      : "";

    const event = {
      id: evRow.id,
      title: evRow.title,
      description: evRow.description,
      start,
      end,
      status: evRow.status,
      location: evRow.location || "",
      lat: evRow.location_lat != null ? Number(evRow.location_lat) : null,
      lng: evRow.location_lng != null ? Number(evRow.location_lng) : null,
      group_id: evRow.group_id,
      group_name: evRow.group_name,
      creator_id: evRow.creator_id,
      creator_name: evRow.creator_name || "Unknown",
    };

    // --- get attendance ---
    let myAttendance = null;
    if (userId) {
      const a = db
        .prepare(
          "SELECT status FROM eventusers WHERE event_id = ? AND user_id = ?"
        )
        .get(eventId, userId);
      if (a && a.status) myAttendance = a.status;
    }

    // render page
    res.render("pages/FS_EventView", {
      event,
      myAttendance,
      username: userRow.username,
      userId,
    });
  } catch (err) {
    console.error("Error rendering event view", err);
    res.status(500).send("Server error");
  }
});

export default views;
