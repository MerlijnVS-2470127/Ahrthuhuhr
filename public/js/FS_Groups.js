let ids = window.ids;
let names = window.names;
let descriptions = window.descriptions;

function decodeString(string) {
  if (string.length != 0) {
    let arr = string.split(",");
    for (let i = 0; i < arr.length; i++) {
      arr[i] = decodeURIComponent(arr[i]);
    }
    return arr;
  } else {
    return string;
  }
}

//<img src="../../public/images/albert2.jpg" class="card-img-top" alt="...">
function loadGroups() {
  let parent = document.getElementById("repeating_cards");

  if (ids.length === 0) {
    parent.innerHTML =
      "<div>When you join a group, they wil be displayed here.<br> You can also create one yourself!</div> ";
  } else {
    for (let i = 0; i < ids.length; i++) {
      parent.innerHTML +=
        '<div class="card" style="width: 18rem">' +
        '<div class="card-header">' +
        '<h1 class="card-title">' +
        names[i] +
        "</h1>" +
        "</div>" +
        '<ul class="list-group list-group-flush">' +
        '<li class="list-group-item">' +
        descriptions[i] +
        "</li>" +
        '<li class="list-group-item">' +
        '<button class="group-button btn btn-primary" type="button" id="' +
        ids[i] +
        '">' +
        "Open chat" +
        " </button>" +
        "</li>" +
        "</ul>" +
        "</div>";
    }
  }
}

addEventListener("load", (e) => {
  let buttons = document.getElementsByClassName("group-button");

  ids = decodeString(ids);
  names = decodeString(names);
  descriptions = decodeString(descriptions);

  loadGroups();

  for (const button of buttons) {
    button.addEventListener("click", (e) => {
      window.location.href = "/groups/" + encodeURIComponent(button.id);
    });
  }
});
