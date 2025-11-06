function validateLogin(){
    let form = document.forms["login"];

    let email = form["userEmail"].value;
    let password = form["userPassword"].value;

    //Controleren met de db -> to be made
}

function validateAccountCreation(){
    let error = document.getElementById("createError");

    let form = document.forms["createAccount"];

    let email = form["userEmail"].value;
    let password = form["userPassword"].value;
    let confirmPassword = form["userConfirmPassword"].value;

    if (password === confirmPassword) {
        if (checkEmailValidity(email)) {
            if (checkEmailAvailability(email)) {
                createSessionStorage(email);
            }
            else{
                error.innerText = "An account with this email already exists";
            }
        }
        else{
            error.innerText = "Email does not have the correct format";
        }
    }
    else{
        error.innerText = "Passwords do not match";
    }
}

function checkEmailValidity(email) {
    //let regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$/;
    //return email.match(regex);
    return true;
}

function checkEmailAvailability(email) {
    return true;
}

function createLocalStorage(email){
    localStorage.setItem("user", email);
    window.location.href = "/";
}

function createSessionStorage(email){
    sessionStorage.setItem("user", email);
    window.location.href = "/";
}

let btn_login = document.getElementById("btn_login");
let btn_createAccount = document.getElementById("btn_createAccount");

btn_login.addEventListener("click", e => {
    validateLogin();
})

btn_createAccount.addEventListener("click", e => {
    validateAccountCreation();
})