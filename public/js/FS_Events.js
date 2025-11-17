document.addEventListener("click", (ev) => {
  const link = ev.target.closest(".event-location");
  if (!link) return;

  ev.preventDefault();

  const lat = link.dataset.lat;
  const lng = link.dataset.lng;
  const label = encodeURIComponent(link.dataset.label || "Location");

  // Redirect to /map with query parameters
  const url = `/map?lat=${lat}&lng=${lng}&label=${label}`;
  window.location.href = url;
});