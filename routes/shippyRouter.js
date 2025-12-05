// shippyRouter.js
import express from "express";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = process.env.GROQ_MODEL || "";
const TIMEOUT_MS = Number(process.env.GROQ_TIMEOUT_MS || 10000);

// Use Photon for geocoding (no API key)
const GEOCODER_PROVIDER = "photon"; // fixed for this router

// Optional Overpass enrichment (set env SHIPPY_USE_OVERPASS='true' to enable)
const USE_OVERPASS = (process.env.SHIPPY_USE_OVERPASS || "false") === "true";

// small per-IP rate guard
const RATE_WINDOW_MS = 3000;
const lastRequest = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const last = lastRequest.get(ip) || 0;
  if (now - last < RATE_WINDOW_MS) return true;
  lastRequest.set(ip, now);
  return false;
}

// caches
const geocodeCache = new Map(); // query -> { t, value }
const overpassCache = new Map(); // key lat:lng:radius -> { t, value }
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes

function cacheGet(map, key) {
  const v = map.get(key);
  if (!v) return null;
  if (Date.now() - v.t > CACHE_TTL_MS) {
    map.delete(key);
    return null;
  }
  return v.value;
}
function cacheSet(map, key, value) {
  map.set(key, { t: Date.now(), value });
}

// deterministic fallback suggestions (safe)
function buildTemplateSuggestions(type, location) {
  const base = [
    `Meet & greet at a popular ${type}`,
    `Group outing: ${type} in ${location}`,
    `Casual ${type} meetup at a local spot`,
  ];
  return base.map((title) => ({
    name: title,
    description: `${title}. Suggestion generated from "${type}" near "${location}".`,
    address: `${location} (approximate)`,
    reason: `Matches request "${type}" near "${location}"`,
  }));
}

// --- LLM (Groq) call ---
async function callGroqChat(prompt, timeoutMs = TIMEOUT_MS) {
  if (!GROQ_API_KEY) return { ok: false, error: "no-key" };

  const url = "https://api.groq.com/openai/v1/chat/completions";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const body = {
    model: GROQ_MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 400,
    temperature: 0.0,
  };

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (r.status === 429)
      return { ok: false, error: "rate_limited", status: 429 };
    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      return {
        ok: false,
        error: `http_${r.status}`,
        status: r.status,
        body: txt,
      };
    }

    const json = await r.json();
    let text = "";
    if (
      Array.isArray(json.choices) &&
      json.choices.length &&
      json.choices[0].message
    ) {
      text = json.choices[0].message.content;
    } else if (typeof json.output_text === "string") {
      text = json.output_text;
    } else {
      text = JSON.stringify(json);
    }
    return { ok: true, raw: json, text: String(text).trim() };
  } catch (err) {
    if (err.name === "AbortError") return { ok: false, error: "timeout" };
    return { ok: false, error: err.message || String(err) };
  }
}

// heuristic parse JSON out of model text
function tryParseJsonFromText(t) {
  if (!t) return null;
  let s = t.trim();
  s = s.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  const arrStart = s.indexOf("[");
  const objStart = s.indexOf("{");
  let candidate = null;
  if (arrStart !== -1) {
    const arrEnd = s.lastIndexOf("]");
    if (arrEnd !== -1 && arrEnd > arrStart)
      candidate = s.slice(arrStart, arrEnd + 1);
  }
  if (!candidate && objStart !== -1) {
    const objEnd = s.lastIndexOf("}");
    if (objEnd !== -1 && objEnd > objStart)
      candidate = s.slice(objStart, objEnd + 1);
  }
  if (!candidate) candidate = s;
  try {
    return JSON.parse(candidate);
  } catch (err) {
    return null;
  }
}

// --- Photon geocoding ---
async function geocodePhoton(query) {
  if (!query) return null;
  const cached = cacheGet(geocodeCache, `photon:${query}`);
  if (cached) return cached;

  try {
    const q = encodeURIComponent(query);
    // Photon endpoint; no key required.
    const url = `https://photon.komoot.io/api/?q=${q}&limit=1`;
    const r = await fetch(url, {
      headers: {
        // polite identifying header (not strictly required, but good practice)
        "User-Agent": "shippy-app/1.0 (github.com/yourname)",
      },
    });
    if (!r.ok) return null;
    const j = await r.json();
    // Photon returns features array; geometry.coordinates [lon, lat]
    if (!j || !Array.isArray(j.features) || j.features.length === 0)
      return null;
    const top = j.features[0];
    const coords = (top.geometry && top.geometry.coordinates) || null;
    if (!coords || coords.length < 2) return null;
    const out = {
      lat: Number(coords[1]),
      lng: Number(coords[0]),
      formatted_address:
        (top.properties &&
          (top.properties.name ||
            top.properties.city ||
            top.properties.country)) ||
        (top.properties && JSON.stringify(top.properties)),
      provider: "photon",
      raw: top,
      confidence: 0.8,
    };
    cacheSet(geocodeCache, `photon:${query}`, out);
    return out;
  } catch (err) {
    console.error("photon geocode error:", err);
    return null;
  }
}

// Overpass query builder & search (optional)
function overpassQuery(lat, lng, radius = 800) {
  return `
    [out:json][timeout:25];
    (
      node(around:${radius},${lat},${lng})[amenity~"restaurant|cafe|bar|pub|fast_food"];
      way(around:${radius},${lat},${lng})[amenity~"restaurant|cafe|bar|pub|fast_food"];
      node(around:${radius},${lat},${lng})[tourism~"hotel|attraction|museum"];
      way(around:${radius},${lat},${lng})[tourism~"hotel|attraction|museum"];
    );
    out center;
  `;
}

async function overpassSearch(lat, lng, radius = 800) {
  const key = `${lat.toFixed(4)}:${lng.toFixed(4)}:${radius}`;
  const cached = cacheGet(overpassCache, key);
  if (cached) return cached;

  try {
    const body = overpassQuery(lat, lng, radius);
    const r = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body,
    });
    if (!r.ok) return null;
    const json = await r.json();
    const features =
      (json.elements || [])
        .map((el) => {
          let coords = null;
          if (el.type === "node") coords = [el.lon, el.lat];
          else if (el.type === "way" && el.center)
            coords = [el.center.lon, el.center.lat];
          return coords
            ? { coords, tags: el.tags || {}, id: el.id, osm_type: el.type }
            : null;
        })
        .filter(Boolean)
        .slice(0, 6) || [];
    cacheSet(overpassCache, key, features);
    return features;
  } catch (err) {
    console.error("overpass error:", err);
    return null;
  }
}

// Prompt builder: ask LLM for canonical geocoding queries (no lat/lng)
function buildPrompt(type, location, user_near_lat, user_near_lng) {
  const near =
    user_near_lat && user_near_lng
      ? `; user_near_lat=${user_near_lat}; user_near_lng=${user_near_lng}`
      : "";
  return `You are Shippy, an assistant that interprets user requests for event suggestions and produces structured, machine-readable geocoding queries. DO NOT invent latitude/longitude. Output ONLY valid JSON (no markdown, no explanation). Use low creativity (temperature=0).

User: type="${type}" ; location="${location}"${near}

TASK:
- If input is nonsense, return:
  {"status":"error","message":"<explain why>"}

- Otherwise return JSON with this exact schema:
{
  "status":"ok",
  "candidates": [
    {
      "name":"<display name>",
      "query":"<canonical string to send to geocoder>",
      "confidence":0.0-1.0,
      "note":"short reason why this matches"
    }, ...
  ]
}

Rules:
- Output at most 3 candidates.
- The "query" should be a short canonical string (example: "Café du Monde, New Orleans, LA").
- Do NOT output lat/lng.
- Set confidence to 1.0 only if this is a known, exact place.
- If you cannot interpret the request, return {"status":"error","message":"<explain>"}.
`;
}

// POST /api/shippy/groq-photon
router.post("/api/shippy/groq-photon", express.json(), async (req, res) => {
  try {
    const ip = req.ip || req.connection?.remoteAddress || "unknown";
    if (rateLimited(ip))
      return res.status(429).json({ status: "error", message: "Rate limit" });

    const { type, location, user_near_lat, user_near_lng } = req.body || {};
    if (!type || !location)
      return res
        .status(400)
        .json({ status: "error", message: "type and location required" });

    const prompt = buildPrompt(type, location, user_near_lat, user_near_lng);
    const call = await callGroqChat(prompt, TIMEOUT_MS);

    if (!call.ok) {
      const fallback = buildTemplateSuggestions(type, location);
      const note =
        call.error === "no-key"
          ? "groq-missing-key"
          : call.error === "timeout"
          ? "groq-timeout"
          : `groq-error:${String(call.error)}`;
      return res.json({ status: "ok", suggestions: fallback, note });
    }

    const parsed = JSON.parse(call.text);

    if (!parsed || parsed.status === "error") {
      const fallback = buildTemplateSuggestions(type, location);
      const note =
        parsed && parsed.message
          ? `model-error:${parsed.message}`
          : "groq-unparseable";
      return res.json({ status: "ok", suggestions: fallback, note });
    }
    const candidates = Array.isArray(parsed.candidates)
      ? parsed.candidates.slice(0, 3)
      : [];
    if (candidates.length === 0) {
      const fallback = buildTemplateSuggestions(type, location);
      return res.json({
        status: "ok",
        suggestions: fallback,
        note: "no-candidates",
      });
    }

    const suggestions = [];
    for (const c of candidates) {
      const name = c.name || c.query || `${type} near ${location}`;
      const query = c.query || c.name || `${type} ${location}`;
      const llmConfidence = Number.isFinite(Number(c.confidence))
        ? Number(c.confidence)
        : 0.6;

      // geocode via Photon
      const geo = await geocodePhoton(query);

      if (geo && Number.isFinite(geo.lat) && Number.isFinite(geo.lng)) {
        // optionally enrich with Overpass
        let poiFeatures = null;
        if (USE_OVERPASS) {
          poiFeatures = await overpassSearch(geo.lat, geo.lng, 800);
        }

        let finalName = name;
        let finalAddress = geo.formatted_address || query;
        let finalLat = geo.lat;
        let finalLng = geo.lng;
        let source = "photon";

        if (Array.isArray(poiFeatures) && poiFeatures.length > 0) {
          const best = poiFeatures[0];
          finalName = best.tags.name || finalName;
          finalAddress =
            best.tags["addr:full"] || best.tags["addr:street"] || finalAddress;
          finalLat = best.coords[1];
          finalLng = best.coords[0];
          source = "overpass+photon";
        }

        suggestions.push({
          name: String(finalName).slice(0, 200),
          description: c.note ? String(c.note).slice(0, 500) : "",
          address: finalAddress,
          reason: c.note || `Matched query: ${query}`,
          lat: Number(finalLat),
          lng: Number(finalLng),
          source,
          source_place_id:
            geo.raw &&
            geo.raw.properties &&
            (geo.raw.properties.osm_id || geo.raw.properties.osm_key)
              ? geo.raw.properties.osm_id || null
              : null,
          confidence: Math.max(
            0,
            Math.min(1, Math.min(llmConfidence, geo.confidence || 0.8))
          ),
        });
      } else {
        // couldn't geocode -> safe fallback without coords
        suggestions.push({
          name: String(name).slice(0, 200),
          description: c.note ? String(c.note).slice(0, 500) : "",
          address: query,
          reason: "could-not-geocode",
        });
      }
    }

    return res.json({ status: "ok", suggestions: suggestions.slice(0, 3) });
  } catch (err) {
    console.error("shippy/groq-photon error:", err);
    return res.status(500).json({ status: "error", message: "server error" });
  }
});

export default router;
