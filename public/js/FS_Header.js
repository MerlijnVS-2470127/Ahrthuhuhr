  // -------//
 // Logout //
// -------//

function logout(){
    sessionStorage.removeItem("user");
    document.cookie = "user=; expires=8 Aug 2013";
    window.location.href = "/login";
}

  // ------------------//
 // General functions //
// ------------------//

function checkUsername(){
    if (getCookieByName("user") != null) {
        let username = getCookieByName("user");
        let usernameDiv = document.getElementById("username");
        usernameDiv.innerText = username;
    }
}

export function getCookieByName(name) {
    const cookieString = document.cookie;
    const cookies = cookieString.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.startsWith(name + '=')) {
            return cookie.substring(name.length + 1);
        }
    }
    return null;
}

  // ----------------//
 // Event listeners //
// ----------------//

let logoutButton = document.getElementById("btn_logout");
let loginButton = document.getElementById("btn_login");

logoutButton.addEventListener("click", e => {
    logout();
})

addEventListener("load", e => {
    checkUsername();
})

