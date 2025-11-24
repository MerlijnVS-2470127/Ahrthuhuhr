// ---------------------------------------------------------//
// Javascipt functions for login in and creating an account //
// ---------------------------------------------------------//

let credentialValidity = window.credentialValidity;
let mode = window.mode;

// ------//
// Login //
// ------//

function validateLogin() {
  let errorBox = document.getElementById("loginError");

  if (credentialValidity === "null") {
    return;
  }

  if (credentialValidity === "false") {
    errorBox.innerText = "Email or password incorrect";
  } else {
    if (credentialValidity === "true") {
      createSessionCookie(window.email);
    }
  }
}

// -----------------//
// Account creation //
// -----------------//

function validateAccountCreation() {
  let errorBox = document.getElementById("createError");

  if (credentialValidity === "null") {
    return;
  }

  if (credentialValidity === "true") {
    if (checkEmailValidity(window.email)) {
      createSessionCookie(window.email);
    } else {
      errorBox.innerText = "Email does not have the correct format";
    }
  } else {
    errorBox.innerText = "An account with this email already exists";
  }
}

// ------------------//
// General functions //
// ------------------//

function checkEmailValidity(email) {
  let regex = new RegExp("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$");
  return email.match(regex);
}

function checkPasswordValidity(password) {
  return true;
}

function createSessionCookie(email) {
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
  let cookies = document.cookie.split(";");
  for (let i = 0; i < cookies.length; i++) {
    document.cookie = cookies[i] += "=;expires=8 Aug 2013";
  }
}

function setFormFocus() {
  if (mode === "create") {
    document.getElementById("collapsable-create").className =
      "login-form collapse show";
  } else {
    document.getElementById("collapsable-login").className =
      "login-form collapse show";
  }
}

// ----------------//
// Event listeners //
// ----------------//

let btn_login = document.getElementById("btn_login");
let btn_createAccount = document.getElementById("btn_createAccount");

btn_login.addEventListener("click", (e) => {
  deleteCookies();

  let form = document.forms["login"];

  let email = form["userEmail"].value;
  let password = form["userPassword"].value;

  if (email != "" && password != "") {
    window.location.href =
      "/login/" +
      encodeURIComponent(email) +
      "/" +
      encodeURIComponent(password) +
      "/" +
      encodeURIComponent("login");
  }
});

btn_createAccount.addEventListener("click", (e) => {
  deleteCookies();

  let errorBox = document.getElementById("createError");
  let form = document.forms["createAccount"];

  let email = form["userEmail"].value;
  let password = form["userPassword"].value;
  let confirmPassword = form["userConfirmPassword"].value;

  if (email != "" && password != "") {
    if (checkPasswordValidity(password)) {
      if (checkEmailValidity(email)) {
        if (password === confirmPassword) {
          window.location.href =
            "/login/" +
            encodeURIComponent(email) +
            "/" +
            encodeURIComponent(password) +
            "/" +
            encodeURIComponent("create");
        } else {
          errorBox.innerText = "Passwords do not match";
        }
      } else {
        errorBox.innerText = "Email does not have the correct format";
      }
    } else {
      errorBox.innerText = "Password does not have the correct format";
    }
  } else {
    errorBox.innerText = "All fields are required";
  }
});

addEventListener("load", (e) => {
  deleteCookies();
  setFormFocus();

  if (mode === "login") {
    validateLogin();
  } else {
    validateAccountCreation();
  }
});
