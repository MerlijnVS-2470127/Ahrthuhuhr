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
import cookieParser from "cookie-parser";

const views = express();
views.use(cookieParser());

//------------------//
// Home page render //
//------------------//
views.get("/", (request, response) => {
  let userCookie = request.headers.cookie.split(";")[0].substring(5);

  let username = checkUsername(db, userCookie);

  response.render("pages/FS_Home", {
    username: username,
  });
});

//-----------------//
// FAQ page render //
//-----------------//
views.get("/faq", (request, response) => {
  if (isAuthorized(request, response, db)) {
    response.render("pages/FS_FAQ");
  } else {
    goToLogin(request, response);
  }
});

//-------------------//
// Login page render //
//-------------------//
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

    console.log(
      "credentialValidity to be returned: " +
        credentialValidity +
        " type: " +
        typeof credentialValidity
    );

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

    console.log(
      "credentialValidity to be returned: " +
        credentialValidity +
        " type: " +
        typeof credentialValidity
    );
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
views.get("/profile/:data/:changed/:email", (request, response) => {
  let changed = decodeURIComponent(request.params.changed);
  let data = decodeURIComponent(request.params.data);
  let email = decodeURIComponent(request.params.email);

  let changeStatus = true;
  let currentUsername = "error loading username";

  if (isAuthorized(request, response, db)) {
    if (changed != "null" && data != "null") {
      changeStatus = changeData(request, response, db, data, changed, email);
    }

    if (changeStatus) {
      currentUsername = checkUsername(db, email);
    }

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
  let email = request.headers.cookie.split(";")[0].substring(5);

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

//chatpagina per groep
views.get("/groups/:groupId", (request, response) => {
  const groupId = request.params.groupId;
  //berichten van groep ophalen
  const messages = db
    .prepare(
      `SELECT id, group_id, user_name, content, created_at FROM messages WHERE group_id = ? ORDER BY created_at ASC`
    )
    .all(groupId);
  response.render("pages/FS_Groupchat", { groupId, messages });
});

//---------------------//
// Events pages render //
//---------------------//

//algemene events pagina
views.get("/events", (request, response) => {
  try {
    // helper (server-side) to abbreviate long names consistently
    function abbreviate(name, max = 25) {
      if (!name) return "";
      const s = String(name);
      return s.length > max ? s.slice(0, max - 1) + "…" : s;
    }
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
        group_name_abbrev: abbreviate(ev.group_name),
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

export default views;
