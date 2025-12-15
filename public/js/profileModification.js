"use strict";
import express from "express";
import cookieParser from "cookie-parser";
import { getCookieByName } from "./getUserInfo.js";

const app = express();
app.use(cookieParser());

export function changeData(req, res, db, data, changed, email) {
  if (authorization(req, email)) {
    switch (changed) {
      case "username":
        return changeUsername(db, email, data);
      default:
        return true;
    }
  } else {
    return false;
  }
}

function authorization(req, email) {
  const userCookie = getCookieByName(req, "user");

  if (userCookie === email) {
    return true;
  }
  return false;
}

export function checkUsername(db, email) {
  let user = db
    .prepare(`SELECT username FROM users WHERE email = ?`)
    .get(email);

  return user.username;
}

function changeUsername(db, email, newUsername) {
  let users = db.prepare(`SELECT email FROM users WHERE email = ?`).all(email);

  if (users.length === 0) {
    return false;
  } else {
    users = db
      .prepare(`UPDATE users SET username = ? WHERE email = ?`)
      .run(newUsername, email);

    return true;
  }
}
