import express from "express";
import { db } from "./db.js";
import {
  isAuthorized,
  goToLogin,
  checkCredentails,
  checkEmailAvailability,
  checkInputValidity,
  createNewAccount  
} from "./public/js/authenticate.js";
import { 
  changeData,
  checkUsername
 } from "./public/js/profileModification.js";
import cookieParser from "cookie-parser";

const views = express();
views.use(cookieParser());

views.get("/", (request, response) => {
  let userCookie = request.headers.cookie.split(";")[0].substring(5);

  let username = checkUsername(db, userCookie)

  response.render("pages/FS_Home", {
    username: username
  });
});

views.get("/faq", (request, response) => {
  if (isAuthorized(request, response, db)) {
    response.render("pages/FS_FAQ");
  } else {
    goToLogin(request, response);
  }
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
    if (changed != "null" && data!= "null") {
      changeStatus = changeData(request, response, db, data, changed, email);
    }

    if (changeStatus) {
      currentUsername = checkUsername(db, email);
    }
    
    response.render("pages/FS_Profile", {
      changeStatus: changeStatus,
      email: email,
      currentUsername: currentUsername
    });
  } else {
    goToLogin(request, response);
  }
});



views.get("/map", (request, response) => {
  response.render("pages/FS_Map");
});

//algemene groups pagina
views.get("/groups", (request, response) => {
  response.render("pages/FS_Groups", {
    groups: [{ id: "testgroup", name: "Test Group" }],
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

//algemene events pagina
views.get("/events", (request, response) => {
  const rows = db
    .prepare(
      `
    SELECT e.*, g.name AS group_name
    FROM events e
    LEFT JOIN groups g ON e.group_id = g.id
    ORDER BY e.start_time ASC
  `
    )
    .all();

  const events = rows.map((ev) => {
    const startMs = ev.start_time ? Number(ev.start_time) : null;
    const endMs = ev.end_time ? Number(ev.end_time) : null;

    const start = startMs
      ? new Date(startMs).toLocaleString("en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "TBD";
    const end = endMs
      ? new Date(endMs).toLocaleString("en-GB", {
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "";

    const locationText = ev.location || ev.group_name || "—";

    // keep coords so template can call the map
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
    };
  });

  response.render("pages/FS_Events", { events });
});

//eventcreation pagina
views.get("/events/eventcreation", (request, response) => {
  response.redirect("/events/new");
});

export default views;
