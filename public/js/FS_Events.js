document.addEventListener("DOMContentLoaded", () => {
  // existing location link behavior
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

  // FILTERS
  const statusCheckboxes = Array.from(
    document.querySelectorAll(".status-filter")
  );
  const groupSelect = document.getElementById("groupFilter");
  const eventsGrid = document.getElementById("eventsGrid");
  const noMatchMsg = document.getElementById("noMatchMsg");
  const noEventsServer = document.getElementById("noEventsServer");

  if (!eventsGrid) return; // nothing to do

  // default: planned + happening now checked
  function setDefaults() {
    statusCheckboxes.forEach((cb) => {
      if (!cb) return;
      if (cb.value === "planned" || cb.value === "happening now")
        cb.checked = true;
      else cb.checked = false;
    });
    if (groupSelect) groupSelect.value = "all";
  }

  // apply filters to DOM
  function applyFilters() {
    const checkedStatuses = statusCheckboxes
      .filter((c) => c.checked)
      .map((c) => c.value);
    const selectedGroup = groupSelect ? groupSelect.value : "all";

    const items = Array.from(eventsGrid.querySelectorAll(".event-tile"));
    let visibleCount = 0;

    items.forEach((item) => {
      const evStatus = item.dataset.status || "";
      const evGroup = String(item.dataset.groupId || "");

      const statusMatch =
        checkedStatuses.length === 0
          ? true
          : checkedStatuses.includes(evStatus);
      const groupMatch =
        selectedGroup === "all" ? true : evGroup === String(selectedGroup);

      if (statusMatch && groupMatch) {
        item.style.display = "";
        visibleCount++;
      } else {
        item.style.display = "none";
      }
    });

    if (visibleCount === 0) {
      noMatchMsg.style.display = "";
    } else {
      noMatchMsg.style.display = "none";
    }
  }

  // wire events
  statusCheckboxes.forEach((cb) => cb.addEventListener("change", applyFilters));
  if (groupSelect) groupSelect.addEventListener("change", applyFilters);

  // run defaults on load
  setDefaults();
  applyFilters();
});
