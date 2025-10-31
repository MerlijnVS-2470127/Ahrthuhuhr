import express from "express";

const views = express();


views.get("/", (request, response) => {
    response.render('pages/FS_Home');
});

views.get('/faq', (request, response) => {
    response.render('pages/FS_FAQ');
});

views.get('/login', (request, response) => {
    response.render('pages/FS_Login');
});


export default views;