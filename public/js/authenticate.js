"use strict";
import express from "express";
import cookieParser from "cookie-parser";

let app = express();
app.use(cookieParser());

export function isAuthorized(req, res, db) {
  if (req.headers.cookie != undefined) {
    if (
      req.headers.cookie.startsWith("user=") &&
      checkUserCookieValidity(req.headers.cookie.split(";")[0], db)
    ) {
      return true;
    }
  }
  return false;
}

export function goToLogin(req, res, db) {
  res.render("pages/FS_Login", { email: "null", mode: "login" });
}

export function checkCredentails(email, password, db) {
  if (email === "null") {
    return "null";
  }

  const users = db
    .prepare(`SELECT password FROM users WHERE email = ?`)
    .all(email);

  if (users.length != 0 && users[0].password === password) {
    return "true";
  }
  return "false";
}

export function createNewAccount(db, email, password, username = "") {
  try {
    const insertUser = db.prepare(
      "INSERT INTO users (email, username, password, last_login) VALUES (?,?,?,?)"
    );

    let last_login = new Date();
    last_login = last_login.getTime();
    console.log(email, username, password, last_login);

    insertUser.run(email, email, password, last_login);
  } catch (error) {
    console.log("ERROR!!!!:  " + error);
  }
}

export function checkEmailAvailability(email, db) {
  if (email === "null") {
    return "null";
  }

  const users = db
    .prepare(`SELECT email FROM users WHERE email = ?`)
    .all(email);

  if (users.length === 0) {
    return "true";
  }
  return "false";
}

export function checkInputValidity(email, password) {
  if (checkEmailValidity(email)) {
    if (checkPasswordValidity(password)) {
      return true;
    }
  }
  return false;
}

function checkEmailValidity(email) {
  let regex = new RegExp("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$");
  return email.match(regex);
}

function checkPasswordValidity(password) {
  //password requirements toe te voegen
  return true;
}

function checkUserCookieValidity(userCookie, db) {
  let email = userCookie.substring(5);

  const users = db
    .prepare(`SELECT email FROM users WHERE email = ?`)
    .all(email);

  if (users.length === 0) {
    return false;
  }
  return true;
}
