let buttons = document.getElementsByClassName("group-button");

for (const button of buttons) {
  button.addEventListener("click", (e) => {
    window.location.href = "/groups/" + encodeURIComponent(button.id);
  });
}

//checkValidity() => FS_CardModule.ejs
