import express from "express";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";
const GROQ_MODEL = process.env.GROQ_MODEL || "";
const TIMEOUT_MS = Number(process.env.GROQ_TIMEOUT_MS || 10000);

// basic per-IP rate guard (very small)
const RATE_WINDOW_MS = 3000;
const lastRequest = new Map();
function rateLimited(ip) {
  const now = Date.now();
  const last = lastRequest.get(ip) || 0;
  if (now - last < RATE_WINDOW_MS) return true;
  lastRequest.set(ip, now);
  return false;
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

// call Groq (OpenAI-compatible endpoint) with timeout
async function callGroqChat(prompt, timeoutMs = TIMEOUT_MS) {
  if (!GROQ_API_KEY) return { ok: false, error: "no-key" };

  const url = "https://api.groq.com/openai/v1/chat/completions"; // Groq OpenAI-compatible endpoint

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const body = {
    model: GROQ_MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 400,
    temperature: 0,
    // adjust as needed; Groq supports OpenAI-compatible params
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

    if (r.status === 429) {
      // rate-limited
      return { ok: false, error: "rate_limited", status: 429 };
    }
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
    // extract text content from common ChatCompletion response shapes
    // OpenAI-style: json.choices[0].message.content
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
      // fallback: stringify full response
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
  // remove ``` fences
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

// POST /api/shippy/groq
router.post("/api/shippy/groq", async (req, res) => {
  try {
    const ip = req.ip || req.connection?.remoteAddress || "unknown";
    if (rateLimited(ip))
      return res.status(429).json({ status: "error", message: "Rate limit" });

    const { type, location } = req.body || {};
    if (!type || !location)
      return res
        .status(400)
        .json({ status: "error", message: "type and location required" });

    // build prompt instructing the model to return strict JSON
    const prompt = `
You are Shippy, an assistant that suggests event/activity options.

User: type="${type}" ; location="${location}"

TASK:
- If the request is nonsense / cannot be interpreted, return JSON:
  {"status":"error","message":"<explain why>"}

- Otherwise return ONLY valid JSON with the following structure:
{
  "status": "ok",
  "suggestions": [
    {"name":"...","description":"...","address":"...","reason":"...","lat":50.1,"lng":5.1},
    ...
  ]
}
Return at most 3 suggestions. Do NOT invent precise coordinates if uncertain. Output valid JSON only.
`;

    // call Groq with timeout
    const call = await callGroqChat(prompt, TIMEOUT_MS);
    console.log(call);
    console.log("fetch headers:", {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    });
    if (!call.ok) {
      // fallback to deterministic suggestions with note
      const fallback = buildTemplateSuggestions(type, location);
      const note =
        call.error === "no-key"
          ? "groq-missing-key"
          : call.error === "timeout"
          ? "groq-timeout"
          : `groq-error:${String(call.error)}`;
      return res.json({ status: "ok", suggestions: fallback, note });
    }

    // parse created text for JSON
    const parsed = tryParseJsonFromText(call.text);

    if (parsed && parsed.status === "error") {
      return res.json({
        status: "error",
        message: parsed.message || "model indicated error",
      });
    }

    if (parsed && parsed.status === "ok" && Array.isArray(parsed.suggestions)) {
      const sanitized = parsed.suggestions.slice(0, 3).map((s) => ({
        name: s.name ? String(s.name).slice(0, 200) : "",
        description: s.description ? String(s.description).slice(0, 500) : "",
        address: s.address ? String(s.address).slice(0, 200) : "",
        reason: s.reason ? String(s.reason).slice(0, 300) : "",
        lat: Number.isFinite(Number(s.lat)) ? Number(s.lat) : undefined,
        lng: Number.isFinite(Number(s.lng)) ? Number(s.lng) : undefined,
      }));
      return res.json({ status: "ok", suggestions: sanitized });
    }

    // model might return an array directly
    if (Array.isArray(parsed) && parsed.length > 0) {
      const sanitized = parsed.slice(0, 3).map((s) => ({
        name: s.name || s.title || "",
        description: s.description || s.desc || "",
        address: s.address || s.label || "",
        reason: s.reason || "",
        lat: Number.isFinite(Number(s.lat)) ? Number(s.lat) : undefined,
        lng: Number.isFinite(Number(s.lng)) ? Number(s.lng) : undefined,
      }));
      return res.json({ status: "ok", suggestions: sanitized });
    }

    // otherwise fallback
    const fallback = buildTemplateSuggestions(type, location);
    return res.json({
      status: "ok",
      suggestions: fallback,
      note: "groq-unparseable",
    });
  } catch (err) {
    console.error("shippy/groq error:", err);
    return res.status(500).json({ status: "error", message: "server error" });
  }
});

export default router;
