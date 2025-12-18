// -------------------------//
// Username cookie function //
// -------------------------//

let username = window.username;

addEventListener("load", (e) => {
  let cookieString = "username=" + username + ";";
  cookieString += " path=/;";
  document.cookie = cookieString;

  let buttons = document.getElementsByClassName("group-button");

  for (const button of buttons) {
    button.addEventListener("click", (e) => {
      window.location.href = "/groups/" + encodeURIComponent(button.id);
    });
  }
});

document.addEventListener("click", (ev) => {
  const link = ev.target.closest(".event-location");
  if (!link) return;

  ev.preventDefault();

  const lat = link.dataset.lat;
  const lng = link.dataset.lng;
  const label = encodeURIComponent(link.dataset.label || "Location");

  const url = `/map?lat=${lat}&lng=${lng}&label=${label}`;
  window.location.href = url;
});
