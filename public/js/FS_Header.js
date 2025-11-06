function logout(){
    localStorage.removeItem("username");
    let username = localStorage.getItem("username");
    let usernameDiv = document.getElementById("username");
    usernameDiv.innerText = username;
}

function login(){
    localStorage.setItem("username", "gog");
    let username = localStorage.getItem("username");
    let usernameDiv = document.getElementById("username");
    usernameDiv.innerText = username;
}

    let username = localStorage.getItem("username");
    let usernameDiv = document.getElementById("username");
    usernameDiv.innerText = username;



let logoutButton = document.getElementById("btn_logout");
let loginButton = document.getElementById("btn_login");

logoutButton.addEventListener("click", e => {
        logout();
    })

loginButton.addEventListener("click", e => {
        login();
    })


