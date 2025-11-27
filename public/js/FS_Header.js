// -------//
// Logout //
// -------//

function logout() {
  sessionStorage.removeItem("user");
  deleteCookies();
  window.location.href =
    "/login/" +
    encodeURIComponent("null") +
    "/" +
    encodeURIComponent("null") +
    "/" +
    encodeURIComponent("login");
}

// ------------------//
// General functions //
// ------------------//

function deleteCookies() {
  let cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    document.cookie = cookies[i] += "=;expires=8 Aug 2013";
  }
}

function checkUsername() {
  if (getCookieByName("username") != null) {
    let username = getCookieByName("username");
    let usernameDiv = document.getElementById("username");
    usernameDiv.innerText = username;
  }
}

export function getCookieByName(name) {
  const cookieString = document.cookie;
  const cookies = cookieString.split(";");
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i].trim();
    if (cookie.startsWith(name + "=")) {
      return cookie.substring(name.length + 1);
    }
  }
  return null;
}

// ----------------//
// Event listeners //
// ----------------//

let logoutButton = document.getElementById("btn_logout");
let profileButton = document.getElementById("btn_editProfile");

logoutButton.addEventListener("click", (e) => {
  logout();
});

profileButton.addEventListener("click", (e) => {
  let email = getCookieByName("user");
  window.location.href =
    "/profile/null/null/" + encodeURIComponent(email);
});

addEventListener("load", (e) => {
  checkUsername();
});
