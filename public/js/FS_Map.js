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

  // If Leaflet didn't load (offline / CDN blocked), show placeholder and abort initialization
  if (typeof L === "undefined") {
    const placeholder = document.getElementById("mapPlaceholder");
    if (placeholder) placeholder.style.display = "flex";
    // ensure the (hidden) real map is not shown
    const mapEl = document.getElementById("map");
    if (mapEl) mapEl.style.display = "none";
    console.warn("Leaflet is not available — showing placeholder");
    return;
  }

  // create map centered on default for now
  const mapEl = document.getElementById("map");
  mapEl.style.display = "block";
  const initialCenter = [DEFAULT.lat, DEFAULT.lng];
  const map = L.map("map").setView(initialCenter, DEFAULT.zoom);

  // show the map element now that leaflet exists
  document.getElementById("map").style.display = "block";
  // hide placeholder if it was visible
  const ph = document.getElementById("mapPlaceholder");
  if (ph) ph.style.display = "none";

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

  // utils to get selected filters
  function getSelectedTypes() {
    return Array.from(document.querySelectorAll(".poi-filter:checked")).map(
      (el) => el.value
    ); // e.g. ['hotel','food']
  }

  // POI loader (calls /api/places?lat=&lng=&radius=&types=hotel,food)
  // NOTE: If no types are selected, we will NOT call the API (per your request).
  async function loadPOIs(lat, lng, radius = RADIUS) {
    try {
      const types = getSelectedTypes();

      // If no types selected — clear POI layer and return (do not query server)
      if (!types.length) {
        poiLayer.clearLayers();
        return;
      }

      const params = new URLSearchParams({
        lat: String(lat),
        lng: String(lng),
        radius: String(radius),
      });
      params.set("types", types.join(","));

      const res = await fetch(`/api/places?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch POIs");
      const geojson = await res.json();

      poiLayer.clearLayers();
      if (!geojson || !Array.isArray(geojson.features)) return;

      geojson.features.forEach((feature) => {
        if (!feature.geometry || feature.geometry.type !== "Point") return;
        const [lngf, latf] = feature.geometry.coordinates;
        const tags = feature.properties.tags || {};

        // compute a meaningful name — prefer tags.name, then common keys
        const name =
          (tags.name && String(tags.name).trim()) ||
          (tags.amenity && String(tags.amenity).trim()) ||
          (tags.tourism && String(tags.tourism).trim()) ||
          (tags.shop && String(tags.shop).trim()) ||
          "";

        // Skip stray/unnamed POIs (often green areas without name), or features that would be labeled "POI"
        if (!name) return;

        // create popup and marker
        const type = tags.amenity || tags.tourism || tags.shop || "";
        const popup = `
          <div>
            <strong>${escapeHtml(name)}</strong><br/>
            <small>${escapeHtml(type)}</small><br/>
            <button data-lat="${latf}" data-lng="${lngf}" data-name="${escapeHtml(
          name
        )}" class="create-event-btn btn btn-sm btn-outline-primary mt-2">
              Create event here
            </button>
          </div>`;
        L.marker([latf, lngf]).addTo(poiLayer).bindPopup(popup);
      });
    } catch (err) {
      console.error("loadPOIs error", err);
    }
  }

  // click handler for create-event buttons -> redirect to event creation page with query params
  document.addEventListener("click", (ev) => {
    const btn = ev.target.closest && ev.target.closest(".create-event-btn");
    if (!btn) return;
    const lat = btn.dataset.lat,
      lng = btn.dataset.lng,
      name = btn.dataset.name || "";

    // optional confirm (keeps previous UX)
    if (!confirm(`Create event at "${name}"? Redirect to creation page?`))
      return;

    const q = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      label: String(name),
    }).toString();

    window.location.href = `/events/new?${q}`;
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

    // load POIs only if types are selected
    if (getSelectedTypes().length) loadPOIs(lat, lng, RADIUS);

    // scroll map into view for UX
    const mapEl = document.getElementById("map");
    if (mapEl) mapEl.scrollIntoView({ behavior: "smooth", block: "center" });
  } else {
    // no query coords — proceed with geolocation attempt
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          map.setView([lat, lng], 15);
          if (getSelectedTypes().length) loadPOIs(lat, lng, RADIUS);
        },
        (err) => {
          console.warn("Geolocation failed or denied:", err);
          if (getSelectedTypes().length)
            loadPOIs(DEFAULT.lat, DEFAULT.lng, RADIUS);
        },
        { timeout: 8000 }
      );
    } else {
      if (getSelectedTypes().length) loadPOIs(DEFAULT.lat, DEFAULT.lng, RADIUS);
    }
  }

  // reload POIs when the map moves (only if filters selected)
  map.on("moveend", () => {
    if (!getSelectedTypes().length) {
      poiLayer.clearLayers();
      return;
    }
    const c = map.getCenter();
    loadPOIs(c.lat, c.lng, RADIUS);
  });

  // ---------------------------
  // Photon autocomplete
  // ---------------------------
  const searchInput = document.getElementById("mapSearchInput");
  const suggestionsEl = document.getElementById("mapSearchSuggestions");
  let suggestionItems = [];
  let selectedSuggestionIndex = -1;
  let suggestionAbortController = null;

  function closeSuggestions() {
    suggestionsEl.style.display = "none";
    suggestionsEl.innerHTML = "";
    suggestionItems = [];
    selectedSuggestionIndex = -1;
  }

  function openSuggestions(items) {
    suggestionsEl.innerHTML = "";
    suggestionItems = items;
    if (!items || !items.length) {
      closeSuggestions();
      return;
    }
    items.forEach((it, idx) => {
      const div = document.createElement("div");
      div.className = "suggestion-item";
      div.dataset.idx = String(idx);
      div.innerHTML = `<strong>${escapeHtml(
        it.name
      )}</strong><br/><small>${escapeHtml(
        it.context || it.country || ""
      )}</small>`;
      div.addEventListener("click", () => {
        chooseSuggestion(idx);
      });
      suggestionsEl.appendChild(div);
    });
    suggestionsEl.style.display = "block";
  }

  function chooseSuggestion(idx) {
    const item = suggestionItems[idx];
    if (!item) return;
    // move map, set marker, load POIs (only if filters selected)
    const lat = Number(item.lat);
    const lon = Number(item.lon);
    map.setView([lat, lon], 15, { animate: true });
    eventMarkerLayer.clearLayers();
    L.marker([lat, lon])
      .addTo(eventMarkerLayer)
      .bindPopup(escapeHtml(item.name))
      .openPopup();

    if (getSelectedTypes().length) loadPOIs(lat, lon, RADIUS);

    // populate input and close
    searchInput.value = item.name;
    closeSuggestions();
  }

  async function fetchPhoton(q) {
    if (!q || q.length < 2) {
      closeSuggestions();
      return;
    }

    // abort previous
    if (suggestionAbortController) suggestionAbortController.abort();
    suggestionAbortController = new AbortController();

    // Use photon public endpoint. If you run into rate limits, self-host or proxy.
    const url = new URL("https://photon.komoot.io/api/");
    url.searchParams.set("q", q);
    url.searchParams.set("limit", "8");

    try {
      const r = await fetch(url.toString(), {
        signal: suggestionAbortController.signal,
      });
      if (!r.ok) throw new Error("Photon failed");
      const json = await r.json();
      const items = (json.features || [])
        .map((f) => {
          const props = f.properties || {};
          return {
            name:
              props.name ||
              props.street ||
              props.city ||
              props.osm_key ||
              props.osm_value ||
              f.properties.osm_id,
            lat: f.geometry.coordinates[1],
            lon: f.geometry.coordinates[0],
            context: [props.city, props.state, props.country]
              .filter(Boolean)
              .join(", "),
          };
        })
        .filter(Boolean);
      openSuggestions(items);
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("photon error", err);
      closeSuggestions();
    }
  }

  // keyboard handling
  searchInput.addEventListener("keydown", (ev) => {
    if (suggestionsEl.style.display === "none") return;
    const items = suggestionsEl.querySelectorAll(".suggestion-item");
    if (!items.length) return;
    if (ev.key === "ArrowDown") {
      ev.preventDefault();
      selectedSuggestionIndex = Math.min(
        selectedSuggestionIndex + 1,
        items.length - 1
      );
      items.forEach((it, i) =>
        it.classList.toggle("active", i === selectedSuggestionIndex)
      );
    } else if (ev.key === "ArrowUp") {
      ev.preventDefault();
      selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, 0);
      items.forEach((it, i) =>
        it.classList.toggle("active", i === selectedSuggestionIndex)
      );
    } else if (ev.key === "Enter") {
      ev.preventDefault();
      if (selectedSuggestionIndex >= 0)
        chooseSuggestion(selectedSuggestionIndex);
      else if (searchInput.value.trim()) fetchPhoton(searchInput.value.trim());
    } else if (ev.key === "Escape") {
      closeSuggestions();
    }
  });

  let searchDebounceTimer = null;
  searchInput.addEventListener("input", (ev) => {
    const v = ev.target.value;
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => fetchPhoton(v), 220);
  });

  // close suggestions when clicking outside
  document.addEventListener("click", (ev) => {
    if (!ev.target.closest || !ev.target.closest(".map-search")) {
      closeSuggestions();
    }
  });

  // ---------------------------
  // Filter checkbox handling
  // ---------------------------
  const filterEls = Array.from(document.querySelectorAll(".poi-filter"));
  filterEls.forEach((el) => {
    el.addEventListener("change", () => {
      // reload POIs for current map center only if some filters are enabled
      const c = map.getCenter();
      if (getSelectedTypes().length) loadPOIs(c.lat, c.lng, RADIUS);
      else poiLayer.clearLayers();
    });
  });
});
