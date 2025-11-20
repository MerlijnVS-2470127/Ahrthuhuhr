  // ---------------------------------------------------------//
 // Javascipt functions for login in and creating an account //
// ---------------------------------------------------------//

let credentialValidity = window.email;

let errorBox = document.getElementById("loginError");

  // ------//
 // Login //
// ------//

function validateLogin(){
    
    if (credentialValidity === "false") {
        errorBox.innerText = "Email or password incorrect";
    }
    else{
        if (!(credentialValidity === "null")) {
            createSessionCookie(credentialValidity)
        }
    }
}

  // -----------------//
 // Account creation //
// -----------------//

function validateAccountCreation(){

    let form = document.forms["createAccount"];

    let email = form["userEmail"].value;
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
    return true;
}

function checkEmailValidity(email) {
    let regex = new RegExp("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$")
    return email.match(regex);
}

function createSessionCookie(email){

    let cookieString = "user=" + email + ";";
    
    /* code for persistence of login (not needed, not completed)
    if (document.forms["login"]["check_stayLoggedIn"].checked) {
        let date = new Date(); date.setFullYear(date.getFullYear() + 30);
        alert(date);
        cookieString += "expires=" + date + ";";
    }
    else{
        let date = new Date(Number.MAX_SAFE_INTEGER);
        alert(date);
        cookieString += "expires=" + date + ";";
    }*/

    cookieString += " path=/;";
    document.cookie = cookieString;
    window.location.href = "/";
}

function deleteCookies() {
    let cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        document.cookie = cookies[i] += "=;expires=8 Aug 2013";
    }
}

  // ----------------//
 // Event listeners //
// ----------------//

let btn_login = document.getElementById("btn_login");
let btn_createAccount = document.getElementById("btn_createAccount");

btn_login.addEventListener("click", e => {
    deleteCookies();

    let form = document.forms["login"];

    let email = form["userEmail"].value;
    let password = form["userPassword"].value;
    
    if (email != "" && password != "") {
        window.location.href = "/login/" + encodeURIComponent(email) + "/" + encodeURIComponent(password);
    }
})

btn_createAccount.addEventListener("click", e => {
    deleteCookies();
    validateAccountCreation();
})

addEventListener("load", e => {
    validateLogin();
})
