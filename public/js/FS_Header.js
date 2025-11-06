function logout(){
    sessionStorage.removeItem("user");
    localStorage.removeItem("user");
    checkLogin();
}

function checkUsername(){
    if (localStorage.getItem("user") != null) {
        let username = localStorage.getItem("user");
        let usernameDiv = document.getElementById("username");
        usernameDiv.innerText = username;
    }
    if (sessionStorage.getItem("user") != null) {
        let username = sessionStorage.getItem("user");
        let usernameDiv = document.getElementById("username");
        usernameDiv.innerText = username;
    }
    
}

function checkLogin(){
    if (localStorage.getItem("user") == null) {
        if (sessionStorage.getItem("user") == null) {
            window.location.href = "/login";
        }
    }
}


let logoutButton = document.getElementById("btn_logout");
let loginButton = document.getElementById("btn_login");

logoutButton.addEventListener("click", e => {
    logout();
}) 

addEventListener("load", e => {
    checkLogin();
    checkUsername();
})


