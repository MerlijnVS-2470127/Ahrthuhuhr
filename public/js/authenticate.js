"use strict";
import express from "express";
import cookieParser from 'cookie-parser';
let app = express();

app.use(cookieParser());

import { db } from "../../db.js";

export function isAuthorized (req, res) {
    console.log("cookies: ", req.headers.cookie)
    if (req.headers.cookie != undefined) {
        if (req.headers.cookie.startsWith("user=") && checkUserValidity(req.headers.cookie.split(';')[0])) {

            return true;
        }
    }
    return false;
}

export function goToLogin(req, res) {
    res.render('pages/FS_Login');
}

function checkUserValidity(userCookie) {
    return true;
}
