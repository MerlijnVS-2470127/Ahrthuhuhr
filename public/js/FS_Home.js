// -------------------------//
// Username cookie function //
// -------------------------//

let username = window.username;

addEventListener("load", (e) => {
  alert(username);
  let cookieString = "username=" + username + ";";
  cookieString += " path=/;";
  document.cookie = cookieString;

  let buttons = document.getElementsByClassName("group-button");

  for (const button of buttons) {
    button.addEventListener("click", (e) => {
      window.location.href = "/groups/" + encodeURIComponent(button.id);
    });
  }
});
