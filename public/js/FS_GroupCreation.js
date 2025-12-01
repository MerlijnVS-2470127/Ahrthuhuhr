// -----------------------------------------//
// JS functions for the group creation page //
// -----------------------------------------//

let message = window.message;

// ------------------//
// General functions //
// ------------------//

function validateSubmit(form) {
  errorBox = document.getElementById("nameError");
  if (form["name"].value === "") {
    alert("[" + form["name"].value + "]");
    errorBox.innerText = "A group name is required";
    return false;
  }
  return true;
}

// ----------------//
// Event listeners //
// ----------------//

let btn_submit = document.getElementById("submitBtn");

btn_submit.addEventListener("click", (e) => {
  let form = document.forms["groupCreateForm"];
  if (validateSubmit(form)) {
    let groupName = form["name"].value;
    let groupDescription = form["description"].value;

    if (groupDescription === "") {
      groupDescription = "null";
    }

    window.location.href =
      "/groups/create/" +
      encodeURIComponent(groupName) +
      "/" +
      encodeURIComponent(groupDescription);
  }
});

addEventListener("load", (e) => {
  if (message === "true") {
    window.location.href = "/groups";
  }
});
