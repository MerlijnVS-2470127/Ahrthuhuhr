import express from "express";
import cookieParser from "cookie-parser";

let app = express();
app.use(cookieParser());

export function getIdbyEmail(db, email) {
  const users = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email);

  return users.id;
}

export function getCurrentUser(req) {
  return getCookieByName(req, "user");
}

export function getCurrentUsername(db, email) {
  let user = db
    .prepare(`SELECT username FROM users WHERE email = ?`)
    .get(email);

  return user.username;
}

export function getCookieByName(req, name) {
  const cookieString = req.headers.cookie;
  console.log("cookieString: " + cookieString);

  const cookies = cookieString.split(";");
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(name + "=")) {
      return cookie.substring(name.length + 1);
    }
  }
  return null;
}
