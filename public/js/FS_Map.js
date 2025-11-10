document.addEventListener("DOMContentLoaded", () => {
    // default center (Hasselt)
    const DEFAULT = { lat: 50.93069, lng: 5.332480, zoom: 15 };
    const RADIUS = 700;
    const map = L.map("map").setView([DEFAULT.lat, DEFAULT.lng], DEFAULT.zoom);

    // OpenStreetMap map tiles afhalen 
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // escape HTML in popups
    function escapeHtml(s) {
        return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    const poiLayer = L.layerGroup().addTo(map);

    // POI's (points of interest) inladen in het weergegeven gebied
    async function loadPOIs(lat, lng, radius = RADIUS) {
        try {
        const res = await fetch(`/api/places?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&radius=${encodeURIComponent(radius)}`);
        if (!res.ok) throw new Error("Failed to fetch POIs");
        const geojson = await res.json();

        poiLayer.clearLayers();
        if (!geojson || !Array.isArray(geojson.features)) return;

        geojson.features.forEach(feature => {
            if (!feature.geometry || feature.geometry.type !== "Point") return;
            const [lngf, latf] = feature.geometry.coordinates;
            const tags = feature.properties.tags || {};
            const name = tags.name || tags.amenity || tags.shop || "POI";
            const type = tags.amenity || tags.tourism || tags.shop || "";
            // popup met informatie over POI en een 'create event' knop
            const popup = `
            <div>
                <strong>${escapeHtml(name)}</strong><br/>
                <small>${escapeHtml(type)}</small><br/>
                <button data-lat="${latf}" data-lng="${lngf}" data-name="${escapeHtml(name)}" class="create-event-btn">
                Create event here
                </button>
            </div>`;

            L.marker([latf, lngf]).addTo(poiLayer).bindPopup(popup);
        });
        } catch (err) {
        console.error("loadPOIs error", err);
        }
    }

    // clickevent handler
    document.addEventListener("click", async (ev) => {
        const btn = ev.target.closest && ev.target.closest(".create-event-btn");
        if (!btn) return;
        const lat = btn.dataset.lat, lng = btn.dataset.lng, name = btn.dataset.name;
        // confirm popup
        if (!confirm(`Create event at "${name}"?`)) return;

        try {
        const res = await fetch("/api/events", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: `Event at ${name}`, lat, lng, placeName: name })
        });
        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: "unknown" }));
            alert("Failed to create event: " + (err.error || "server error"));
            return;
        }
        alert("Event created! (is what I would say if the events were already implemented ¯\\_(ツ)_/¯)");
        } catch (err) {
        console.error(err);
        alert("Network error creating event");
        }
    });

    // probeer huidige locatie weer te geven
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(position => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        map.setView([lat, lng], 15);
        loadPOIs(lat, lng, RADIUS);
        }, (err) => {
        console.warn("Geolocation failed or denied:", err);
        loadPOIs(DEFAULT.lat, DEFAULT.lng, RADIUS);
        }, { timeout: 8000 });
    // als dit mislukt terugvallen op de default
    } else {
        loadPOIs(DEFAULT.lat, DEFAULT.lng, RADIUS);
    }

    // POI's herladen na beweging map
    map.on("moveend", () => {
        const c = map.getCenter();
        loadPOIs(c.lat, c.lng, RADIUS);
    });

    // map search
    const provider = new window.GeoSearch.OpenStreetMapProvider();
    const search = new window.GeoSearch.GeoSearchControl({
        provider: provider,
        style: 'bar',
        showMarker: true,
        showPopup: true,
        autoClose: true,
        searchLabel: 'Search location...'
    });
    map.addControl(search);
});
