// -------------------------//
// Username cookie function //
// -------------------------//

let username = window.username;

addEventListener("load", (e) => {
    let cookieString = "username=" + username + ";";
    cookieString += " path=/;";
    document.cookie = cookieString;
});