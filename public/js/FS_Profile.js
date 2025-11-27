// ---------------------------------------------------------//
// Javascipt functions for Editing profile information      //
// ---------------------------------------------------------//


// global variables
let currentUsername = window.currentUsername;
let changedStatus = window.changedStatus;
let email = window.email;

// ------------------//
// General functions //
// ------------------//

function displayError() {
    let errorBox = document.getElementById("changeError");
    errorBox.innerText = "There was an error with changing your username.";
}

function displayUsername() {
    let username_display = document.getElementById("username_display");

    if (changedStatus != "false") {
        username_display.innerText = "Username: " + currentUsername;
    }
    else{
        username_display.innerText = "Username"
    }
}

function updateCookie(){
    if (changedStatus != "false") {
        document.cookie = "username=" + currentUsername + "; path=/;";
    }
}


//-----------------//
// Event Listeners //
//-----------------//

let btn_change = document.getElementById("btn_change");

btn_change.addEventListener("click", (e) => {

    let input = document.forms["changeData"]["newUsername_input"].value;
    if (input.innerText != "") {
        window.location.href = 
        "/profile/" +
        encodeURIComponent(input)+
        "/" +
        encodeURI("username") +
        "/" +
        encodeURIComponent(email);
    }
});

addEventListener("load", (e) => {
    if (!changedStatus) {
        displayError();
    }
    else{
        updateCookie();
        displayUsername();
    }
});
