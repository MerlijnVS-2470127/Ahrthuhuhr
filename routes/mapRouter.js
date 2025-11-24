import express from "express";
const router = express.Router();

// tiny in-memory cache
const cache = new Map();
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

function cacheKey(lat, lng, radius) {
  // rounded to reduce cache misses
  return `${lat.toFixed(4)}:${lng.toFixed(4)}:${radius}`;
}

function overpassQuery(lat, lng, radius) {
  return `
    [out:json][timeout:25];
    (
      // amenities: food & drink
      node(around:${radius},${lat},${lng})[amenity~"restaurant|cafe|bar|pub|fast_food"];
      way(around:${radius},${lat},${lng})[amenity~"restaurant|cafe|bar|pub|fast_food"];

      // tourism: hotels/hostels, attractions, museums
      node(around:${radius},${lat},${lng})[tourism~"hotel|guest_house|hostel|attraction|museum"];
      way(around:${radius},${lat},${lng})[tourism~"hotel|guest_house|hostel|attraction|museum"];

      // shops: ice cream, bakery, supermarket, convenience, etc.
      node(around:${radius},${lat},${lng})[shop~"ice_cream|bakery|supermarket|convenience|grocery|kiosk|confectionery|clothes|fashion|boutique|shoes"];
      way(around:${radius},${lat},${lng})[shop~"ice_cream|bakery|supermarket|convenience|grocery|kiosk|confectionery|clothes|fashion|boutique|shoes"];

      // entertainment: cinemas and theatres
      node(around:${radius},${lat},${lng})[amenity~"cinema|theatre"];
      way(around:${radius},${lat},${lng})[amenity~"cinema|theatre"]; 
    );
    out center;
  `;
}

// GET /api/places?lat=..&lng=..&radius=..
router.get("/api/places", async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = Number(req.query.radius || 1000);
    if (!lat || !lng)
      return res.status(400).json({ error: "lat,lng required" });

    const key = cacheKey(lat, lng, radius);
    const now = Date.now();

    // return cache if fresh
    const cached = cache.get(key);
    if (cached && now - cached.t < CACHE_TTL_MS) {
      return res.json(cached.geojson);
    }

    // build and send Overpass request
    const body = overpassQuery(lat, lng, radius);
    const overpassUrl = "https://overpass-api.de/api/interpreter";
    const r = await fetch(overpassUrl, { method: "POST", body });
    if (!r.ok) return res.status(502).json({ error: "Overpass error" });

    const data = await r.json();

    // convert to GeoJSON FeatureCollection
    const features = (data.elements || [])
      .map((el) => {
        let coords = null;
        if (el.type === "node") coords = [el.lon, el.lat];
        else if (el.type === "way" && el.center)
          coords = [el.center.lon, el.center.lat];
        return coords
          ? {
              type: "Feature",
              geometry: { type: "Point", coordinates: coords },
              properties: { id: el.id, tags: el.tags || {}, osm_type: el.type },
            }
          : null;
      })
      .filter(Boolean);

    const geojson = { type: "FeatureCollection", features };

    // cache and return
    cache.set(key, { t: now, geojson });
    res.json(geojson);
  } catch (err) {
    console.error("places API error", err);
    res.status(500).json({ error: "server error" });
  }
});

// Simple event creation route (adapt to your DB schema)
router.post("/api/events", async (req, res) => {
  // ensure body parser is enabled (app.use(express.json()))
  const { title, lat, lng, placeName } = req.body;
  if (!title || !lat || !lng)
    return res.status(400).json({ error: "missing fields" });

  try {
    const created_at = Date.now();
    // Use your better-sqlite3 db instance — adjust import to your project
    // Example with a db prepared statement:
    // const info = db.prepare('INSERT INTO events (group_id, created_by, title, lat, lng, poi_snapshot_json, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run('testgroup', null, title, lat, lng, JSON.stringify({name:placeName}), created_at);
    // return res.status(201).json({ id: info.lastInsertRowid, title, placeName });

    // temporary stub response (if you haven't hooked DB yet)
    return res
      .status(201)
      .json({ id: -1, title, placeName, lat, lng, created_at });
  } catch (err) {
    console.error("create event error", err);
    res.status(500).json({ error: "server error" });
  }
});

export default router;
