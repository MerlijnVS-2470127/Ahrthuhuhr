import express from "express";
import { db } from "./db.js";
import { isAuthorized, goToLogin } from "./public/js/authenticate.js";

const views = express();

views.get("/", (request, response) => {
    
    response.render('pages/FS_Home');
});

views.get('/faq', (request, response) => {
    if (isAuthorized(request, response)) {
        response.render('pages/FS_FAQ');
    }
    else{
        goToLogin(request, response);
    }
});


views.get('/login', (request, response) => {
    response.render('pages/FS_Login');
});

//algemene groups pagina
views.get("/groups", (request, response) => {
    response.render('pages/FS_Groups', { groups: [{ id: "testgroup", name: "Test Group" }] });
})

views.get("/events", (request, response) => {
    response.render('pages/FS_Events');
})


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

views.get('/map', (request, response) => {
    response.render('pages/FS_Map');
});

export default views;