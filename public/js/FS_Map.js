// /public/js/FS_Map.js
document.addEventListener("DOMContentLoaded", () => {
  // default center (Hasselt)
  const DEFAULT = { lat: 50.93069, lng: 5.33248, zoom: 15 };
  const RADIUS = 700;

  // parse query params early
  const params = new URLSearchParams(window.location.search);
  const qLat = params.get("lat");
  const qLng = params.get("lng");
  const qLabel = params.get("label")
    ? decodeURIComponent(params.get("label"))
    : "";

  const hasQueryLocation =
    qLat &&
    qLng &&
    !Number.isNaN(parseFloat(qLat)) &&
    !Number.isNaN(parseFloat(qLng));

  // create map centered on default for now
  const initialCenter = [DEFAULT.lat, DEFAULT.lng];
  const map = L.map("map").setView(initialCenter, DEFAULT.zoom);

  // OpenStreetMap tiles
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  // layers
  const poiLayer = L.layerGroup().addTo(map);
  const eventMarkerLayer = L.layerGroup().addTo(map);

  // expose map & layers globally for other scripts
  window.appMap = map;
  window.appPoiLayer = poiLayer;
  window.appEventMarkerLayer = eventMarkerLayer;

  // helper to show an event location from anywhere in the app
  window.showEventLocation = function (lat, lng, label = "") {
    lat = Number(lat);
    lng = Number(lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    // clear previous event markers
    eventMarkerLayer.clearLayers();

    // animate map to the event
    map.setView([lat, lng], 16, { animate: true });

    // drop an event marker
    const m = L.marker([lat, lng]).addTo(eventMarkerLayer);
    if (label) m.bindPopup(`<strong>${escapeHtml(label)}</strong>`).openPopup();
  };

  // escape HTML for popup content
  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // POI loader (as you had it)
  async function loadPOIs(lat, lng, radius = RADIUS) {
    try {
      const res = await fetch(
        `/api/places?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(
          lng
        )}&radius=${encodeURIComponent(radius)}`
      );
      if (!res.ok) throw new Error("Failed to fetch POIs");
      const geojson = await res.json();

      poiLayer.clearLayers();
      if (!geojson || !Array.isArray(geojson.features)) return;

      geojson.features.forEach((feature) => {
        if (!feature.geometry || feature.geometry.type !== "Point") return;
        const [lngf, latf] = feature.geometry.coordinates;
        const tags = feature.properties.tags || {};
        const name = tags.name || tags.amenity || tags.shop || "POI";
        const type = tags.amenity || tags.tourism || tags.shop || "";
        const popup = `
          <div>
            <strong>${escapeHtml(name)}</strong><br/>
            <small>${escapeHtml(type)}</small><br/>
            <button data-lat="${latf}" data-lng="${lngf}" data-name="${escapeHtml(
          name
        )}" class="create-event-btn">
              Create event here
            </button>
          </div>`;
        L.marker([latf, latf ? latf : 0]).addTo(poiLayer); // safety - though coords exist
        L.marker([latf, latf ? latf : 0]).bindPopup(popup); // we will replace with correct usage below
        // correct marker creation:
        L.marker([latf, lngf]).addTo(poiLayer).bindPopup(popup);
      });
    } catch (err) {
      console.error("loadPOIs error", err);
    }
  }

  // click handler for create-event buttons
  document.addEventListener("click", async (ev) => {
    const btn = ev.target.closest && ev.target.closest(".create-event-btn");
    if (!btn) return;
    const lat = btn.dataset.lat,
      lng = btn.dataset.lng,
      name = btn.dataset.name;
    if (!confirm(`Create event at "${name}"?`)) return;

    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `Event at ${name}`,
          lat,
          lng,
          placeName: name,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "unknown" }));
        alert("Failed to create event: " + (err.error || "server error"));
        return;
      }
      alert("Event created!");
    } catch (err) {
      console.error(err);
      alert("Network error creating event");
    }
  });

  // If URL contains coords, focus there and don't request geolocation permission
  if (hasQueryLocation) {
    const lat = parseFloat(qLat);
    const lng = parseFloat(qLng);

    // center and mark
    map.setView([lat, lng], 15);
    eventMarkerLayer.clearLayers();
    L.marker([lat, lng])
      .addTo(eventMarkerLayer)
      .bindPopup(escapeHtml(qLabel || "Selected location"))
      .openPopup();

    // load POIs around that point
    loadPOIs(lat, lng, RADIUS);

    // scroll map into view for UX
    const mapEl = document.getElementById("map");
    if (mapEl) mapEl.scrollIntoView({ behavior: "smooth", block: "center" });
  } else {
    // no query coords — proceed with geolocation attempt (this will show permission prompt)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          map.setView([lat, lng], 15);
          loadPOIs(lat, lng, RADIUS);
        },
        (err) => {
          console.warn("Geolocation failed or denied:", err);
          loadPOIs(DEFAULT.lat, DEFAULT.lng, RADIUS);
        },
        { timeout: 8000 }
      );
    } else {
      // navigator not available — just load default POIs
      loadPOIs(DEFAULT.lat, DEFAULT.lng, RADIUS);
    }
  }

  // reload POIs when the map moves
  map.on("moveend", () => {
    const c = map.getCenter();
    loadPOIs(c.lat, c.lng, RADIUS);
  });

  // map search control
  const provider = new window.GeoSearch.OpenStreetMapProvider();
  const search = new window.GeoSearch.GeoSearchControl({
    provider: provider,
    style: "bar",
    showMarker: true,
    showPopup: true,
    autoClose: true,
    searchLabel: "Search location...",
  });
  map.addControl(search);
});
