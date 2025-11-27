
let ids = window.ids.split(",");
let names = window.names.split(","); 


//<img src="../../public/images/albert2.jpg" class="card-img-top" alt="...">
function loadGroups() {
  let parent = document.getElementById("repeating_cards");

  for (let i = 0; i < ids.length; i++) {
    parent.innerHTML += '<div class="card" style="width: 18rem">' +
        '<div class="card-body">' +
          '<h1 class="card-title">' + names[i] + '</h1>' +
          '<button class="group-button btn btn-primary" type="button" id="' + ids[i] + '">' +
            "Open chat" +
         ' </button>' +
        '</div>' +
      '</div>';
  }
}


addEventListener("load", (e) => {
  loadGroups();
  let buttons = document.getElementsByClassName("group-button");

  for (const button of buttons) {
    button.addEventListener("click", (e) => {
      window.location.href = "/groups/" + encodeURIComponent(button.id);
    });
  }
})
