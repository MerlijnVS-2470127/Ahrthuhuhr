import express from "express";
const router = express.Router();

// tiny in-memory cache
const cache = new Map();
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

function cacheKey(lat, lng, radius, types) {
  // rounded to reduce cache misses
  const tKey = (types || "").split(",").sort().join(",");
  return `${lat.toFixed(4)}:${lng.toFixed(4)}:${radius}:${tKey}`;
}

// build Overpass filter blocks for chosen categories
function buildOverpassBlocks(lat, lng, radius, types = []) {
  const blocks = [];

  // helper to push node+way selectors for a tag pattern
  const pushPattern = (tag, pattern) => {
    blocks.push(`node(around:${radius},${lat},${lng})[${tag}~"${pattern}"];`);
    blocks.push(`way(around:${radius},${lat},${lng})[${tag}~"${pattern}"];`);
  };

  // map of category -> filters
  const cats = {
    hotel: () => {
      // hotels/hostels/guest houses
      pushPattern(
        "tourism",
        "hotel|guest_house|hostel|motel|bed_and_breakfast"
      );
    },
    food: () => {
      // restaurants, cafes, bars, pubs, fast_food
      pushPattern("amenity", "restaurant|cafe|bar|pub|fast_food");
    },
    shops: () => {
      // general shops - broad selection
      pushPattern(
        "shop",
        "bakery|supermarket|convenience|grocery|kiosk|confectionery|clothes|fashion|boutique|shoes|ice_cream|bookstore|mall"
      );
    },
    other: () => {
      // attractions, parks, cinemas, theatres, museums
      pushPattern("tourism", "attraction|museum");
      pushPattern("leisure", "park|sports_centre|stadium|garden");
      pushPattern("amenity", "cinema|theatre");
    },
  };

  // If no types specified, include all categories (same as previous behavior)
  if (!types || types.length === 0) {
    // include all existing categories
    Object.keys(cats).forEach((k) => cats[k]());
    return blocks;
  }

  // otherwise include only selected
  for (const t of types) {
    if (cats[t]) cats[t]();
  }
  return blocks;
}

function overpassQuery(lat, lng, radius, types = []) {
  const blocks = buildOverpassBlocks(lat, lng, radius, types);
  // if blocks empty (shouldn't happen) fallback to all
  const joined = blocks.join("\n      ");
  return `
    [out:json][timeout:25];
    (
      ${joined}
    );
    out center;
  `;
}

// GET /api/places?lat=..&lng=..&radius=..&types=hotel,food
router.get("/api/places", async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = Number(req.query.radius || 1000);
    if (!lat || !lng)
      return res.status(400).json({ error: "lat,lng required" });

    // parse types param
    const typesParam = (req.query.types || "").trim();
    const types = typesParam
      ? typesParam
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

    const key = cacheKey(lat, lng, radius, typesParam);
    const now = Date.now();

    // return cache if fresh
    const cached = cache.get(key);
    if (cached && now - cached.t < CACHE_TTL_MS) {
      return res.json(cached.geojson);
    }

    // build and send Overpass request
    const body = overpassQuery(lat, lng, radius, types);
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

// Simple event creation route (unchanged from your file)
router.post("/api/events", async (req, res) => {
  const { title, lat, lng, placeName } = req.body;
  if (!title || !lat || !lng)
    return res.status(400).json({ error: "missing fields" });

  try {
    const created_at = Date.now();
    return res
      .status(201)
      .json({ id: -1, title, placeName, lat, lng, created_at });
  } catch (err) {
    console.error("create event error", err);
    res.status(500).json({ error: "server error" });
  }
});

export default router;
