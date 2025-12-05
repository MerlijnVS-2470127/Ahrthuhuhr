document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("shippyForm");
  const results = document.getElementById("shippyResults");

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function showBusy(msg = "Searching…") {
    results.innerHTML = `<div class="text-muted">${escapeHtml(msg)}</div>`;
  }

  function showError(msg) {
    results.innerHTML = `<div class="text-danger">${escapeHtml(msg)}</div>`;
  }

  function renderSuggestions(suggestions) {
    results.innerHTML = "";
    suggestions.forEach((s) => {
      const card = document.createElement("div");
      card.className = "card mb-2 p-3";
      const title = escapeHtml(s.name || s.title || "Suggestion");
      const desc = escapeHtml(s.description || "");
      const addr = escapeHtml(s.address || "");
      const lat = s.lat !== undefined && s.lat !== null ? s.lat : "";
      const lng = s.lng !== undefined && s.lng !== null ? s.lng : "";

      card.innerHTML = `
        <div class="d-flex justify-content-between">
          <div style="max-width:70%">
            <strong>${title}</strong>
            <div class="text-muted small mt-1">${desc}</div>
            <div class="small text-muted mt-1">${addr}${
        lat && lng
          ? ` — ${lat.toFixed ? lat.toFixed(5) : lat}, ${
              lng.toFixed ? lng.toFixed(5) : lng
            }`
          : ""
      }</div>
          </div>
          <div class="text-end">
            <button class="btn btn-sm btn-outline-primary use-suggestion" 
              data-lat="${lat}" data-lng="${lng}" data-label="${addr}" data-title="${escapeHtml(
        s.name || ""
      )}" data-desc="${escapeHtml(s.description || "")}">
              Use this
            </button>
          </div>
        </div>
      `;
      results.appendChild(card);
    });

    // wire buttons
    Array.from(results.querySelectorAll(".use-suggestion")).forEach((btn) => {
      btn.addEventListener("click", () => {
        const lat = btn.dataset.lat;
        const lng = btn.dataset.lng;
        const label = btn.dataset.label || "";
        const title = btn.dataset.title || "";
        const description = btn.dataset.desc || "";

        const q = new URLSearchParams();
        if (lat) q.set("lat", lat);
        if (lng) q.set("lng", lng);
        if (label) q.set("label", label);
        if (title) q.set("title", title);
        if (description) q.set("description", description);

        window.location.href = "/events/new?" + q.toString();
      });
    });
  }

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const type = document.getElementById("shippyType").value.trim();
    const location = document.getElementById("shippyLocation").value.trim();
    if (!type || !location) {
      showError("Please fill both fields.");
      return;
    }

    showBusy();

    try {
      const res = await fetch("/api/shippy/groq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, location }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        showError(json.message || json.error || "Server error");
        return;
      }

      if (json.status === "error") {
        showError(json.message || "Shippy couldn't interpret your request.");
        return;
      }

      const suggestions = json.suggestions || [];
      if (!Array.isArray(suggestions) || suggestions.length === 0) {
        const note = json.note ? ` (${json.note})` : "";
        showError(
          "No suggestions returned. Try a broader location or different query." +
            note
        );
        return;
      }

      renderSuggestions(suggestions);
    } catch (err) {
      console.error("Shippy fetch error", err);
      showError("Network error contacting Shippy.");
    }
  });
});
