  // ---------------------------------------------------------//
 // Javascipt functions for login in and creating an account //
// ---------------------------------------------------------//

import { db } from "./db.js";

  // ------//
 // Login //
// ------//

function validateLogin(){
    let errorBox = document.getElementById("loginError");

    let form = document.forms["login"];

    let email = form["userEmail"].value;
    let givenPassword = form["userPassword"].value;
    let persist = form["check_stayLoggedIn"].value;

    //Controleren met de db
    if (!checkEmailAvailability()) {
        let passwordSearch = db.prepare(`SELECT password FROM users WHERE email = ?`).all(email);

        if (passwordSearch === givenPassword) {
            createSessionCookie(email, persist);
        }
        else{
            errorBox.innerText = "Email or password incorrect";
        }
    }
    else{
        errorBox.innerText = "Email or password incorrect";
    }
}

  // -----------------//
 // Account creation //
// -----------------//

function validateAccountCreation(){
    let errorBox = document.getElementById("createError");

    let form = document.forms["createAccount"];

    let email = form["userEmail"].value;
    alert(email);
    let password = form["userPassword"].value;
    let confirmPassword = form["userConfirmPassword"].value;

    if (password === confirmPassword) {
        if (checkEmailValidity(email)) {
            if (checkEmailAvailability(email)) {
                createSessionCookie(email);
            }
            else{
                errorBox.innerText = "An account with this email already exists";
            }
        }
        else{
            errorBox.innerText = "Email does not have the correct format";
        }
    }
    else{
        errorBox.innerText = "Passwords do not match";
    }
}

  // ------------------//
 // General functions //
// ------------------//

function checkEmailAvailability(email) {
    let emailSearch = db.prepare(`SELECT email FROM users WHERE email = ?`).all(email);
    if (!emailSearch) {
        return true;
    }
    return false;
}

function checkEmailValidity(email) {
    let regex = new RegExp("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    return email.match(regex);
}

function createSessionCookie(email, persist = false){
    document.cookie = "user=" + email;
    window.location.href = "/";
}

  // ----------------//
 // Event listeners //
// ----------------//

let btn_login = document.getElementById("btn_login");
let btn_createAccount = document.getElementById("btn_createAccount");

btn_login.addEventListener("click", e => {
    validateLogin();
})

btn_createAccount.addEventListener("click", e => {
    validateAccountCreation();
})

addEventListener("load", e => {
    let cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        document.cookie = cookies[i] += "=;expires=8 Aug 2013";
    }
})