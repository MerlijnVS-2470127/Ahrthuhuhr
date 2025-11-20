"use strict";
import express from "express";
import cookieParser from "cookie-parser";

let app = express();
app.use(cookieParser());

export function isAuthorized (req, res, db) {
    if (req.headers.cookie != undefined) {
        if (req.headers.cookie.startsWith("user=") && checkUserCookieValidity(req.headers.cookie.split(';')[0], db)) {
            return true;
        }
    }
    return false;
}

export function goToLogin(req, res, db) {
    res.render('pages/FS_Login', { email: "null" });
}

export function checkCredentails(email, password, db) {

    if (email === "null") {
        return "null";
    }

    const users = db
      .prepare(
        `SELECT password FROM users WHERE email = ?`
      )
      .all(email);
      

    if (users.length != 0 && users[0].password === password) {
        return email;
    }
    return "false";
}

function checkUserCookieValidity(userCookie, db) {
    let email = userCookie.substring(5);

    const users = db
      .prepare(
        `SELECT email FROM users WHERE email = ?`
      )
      .all(email);

    if (users.length === 0) {
        return false;
    }
    return true;
}
