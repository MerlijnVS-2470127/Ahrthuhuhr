(() => {
  const form = document.getElementById("eventCreateForm");
  const findBtn = document.getElementById("findOnMapBtn");
  const toggleEndBtn = document.getElementById("toggleEndBtn");
  const removeEndBtn = document.getElementById("removeEndBtn");
  const endRow = document.getElementById("endRow");
  const startDateEl = document.getElementById("startDate");
  const endDateEl = document.getElementById("endDate");
  const confirmModalEl = document.getElementById("confirmModal");
  const confirmCreateBtn = document.getElementById("confirmCreateBtn");
  const toastContainer = document.getElementById("toastContainer");

  // bootstrap modal instance (assumes bootstrap.js present)
  let confirmModal = null;

  if (confirmModalEl) {
    confirmModalEl.addEventListener("hidden.bs.modal", () => {
      pendingPayload = null;
      // zorg dat de confirm button weer enabled is (defensief)
      if (confirmCreateBtn) confirmCreateBtn.disabled = false;
    });
  }

  let pendingPayload = null;

  confirmCreateBtn.addEventListener("click", async () => {
    if (!pendingPayload) return; // nothing to do
    confirmCreateBtn.disabled = true; // prevent double click
    try {
      await sendCreate(pendingPayload);
    } finally {
      pendingPayload = null;
      confirmCreateBtn.disabled = false;
      if (confirmModal) confirmModal.hide();
    }
  });

  if (window.bootstrap) confirmModal = new bootstrap.Modal(confirmModalEl);

  function showToast(message, type = "info", timeout = 4000) {
    // type: info|success|warning|danger
    const toastId = "t" + Math.random().toString(36).slice(2, 9);
    const bgClass =
      type === "success"
        ? "bg-success text-white"
        : type === "danger"
        ? "bg-danger text-white"
        : type === "warning"
        ? "bg-warning text-dark"
        : "bg-light text-dark";
    const html = `
      <div id="${toastId}" class="toast ${bgClass}" role="alert" aria-live="polite" aria-atomic="true" data-bs-delay="${timeout}">
        <div class="d-flex">
          <div class="toast-body">${message}</div>
          <button type="button" class="btn-close btn-close-white ms-auto me-2" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>
    `;
    toastContainer.insertAdjacentHTML("beforeend", html);
    const el = document.getElementById(toastId);
    const t = new bootstrap.Toast(el);
    t.show();
    el.addEventListener("hidden.bs.toast", () => el.remove());
  }

  // find on map: redirect to /map with label param; map script will handle lat/lng optionally
  findBtn.addEventListener("click", (ev) => {
    ev.preventDefault();
    const label = encodeURIComponent(
      document.getElementById("location").value.trim() || ""
    );
    // redirect with label even if empty (map handles defaults)
    window.location.href = `/map?label=${label}`;
  });

  // toggle end row
  toggleEndBtn.addEventListener("click", () => {
    if (endRow.style.display === "none" || endRow.style.display === "") {
      // show
      endRow.style.display = "flex";
      // auto-fill end date if start present and end empty
      if (startDateEl.value && !endDateEl.value)
        endDateEl.value = startDateEl.value;
      toggleEndBtn.style.display = "none";
    }
  });

  removeEndBtn.addEventListener("click", () => {
    endRow.style.display = "none";
    document.getElementById("endDate").value = "";
    document.getElementById("endTime").value = "";
    toggleEndBtn.style.display = "inline-block";
  });

  // when startDate changes, update endDate if visible
  startDateEl.addEventListener("change", () => {
    if (endRow.style.display !== "none") {
      if (!endDateEl.value) endDateEl.value = startDateEl.value;
      // also ensure end date >= start date
      if (endDateEl.value < startDateEl.value) {
        endDateEl.value = startDateEl.value;
      }
    }
  });

  // helper parse coord
  function parseCoord(v) {
    if (!v && v !== 0) return null;
    const n = Number(String(v).trim());
    return Number.isFinite(n) ? n : NaN;
  }

  // validation function; returns {ok:bool, payload:object}
  function validateAndBuild() {
    // clear invalid classes
    ["location", "title", "startDate", "startTime", "groupSelect"].forEach(
      (id) => {
        const el = document.getElementById(id);
        if (el) el.classList.remove("is-invalid");
      }
    );

    const location = document.getElementById("location").value.trim();
    const title = document.getElementById("title").value.trim();
    const description = document.getElementById("description").value.trim();
    const groupId = document.getElementById("groupSelect").value;
    const startDate = document.getElementById("startDate").value;
    const startTime = document.getElementById("startTime").value;
    const endDate = document.getElementById("endDate").value;
    const endTime = document.getElementById("endTime").value;
    const latRaw = document.getElementById("lat").value.trim();
    const lngRaw = document.getElementById("lng").value.trim();

    let invalid = false;
    if (!location) {
      document.getElementById("location").classList.add("is-invalid");
      invalid = true;
    }
    if (!title) {
      document.getElementById("title").classList.add("is-invalid");
      invalid = true;
    }
    if (!groupId) {
      document.getElementById("groupSelect").classList.add("is-invalid");
      invalid = true;
    }
    if (!startDate) {
      document.getElementById("startDate").classList.add("is-invalid");
      invalid = true;
    }
    if (!startTime) {
      document.getElementById("startTime").classList.add("is-invalid");
      invalid = true;
    }

    if (invalid) {
      showToast("Please fill required fields.", "warning");
      return { ok: false };
    }

    // build ms
    const startIso = `${startDate}T${startTime}`;
    const startMs = Date.parse(startIso);
    if (Number.isNaN(startMs)) {
      document.getElementById("startDate").classList.add("is-invalid");
      showToast("Invalid start date/time", "danger");
      return { ok: false };
    }
    if (startMs < Date.now()) {
      document.getElementById("startDate").classList.add("is-invalid");
      showToast("Start date/time cannot be in the past", "danger");
      return { ok: false };
    }

    let endMs = null;
    if (endRow.style.display !== "none" && (endDate || endTime)) {
      // require both date/time or at least date; we'll allow optional time but if time empty treat as 00:00?
      if (!endDate) {
        document.getElementById("endDate").classList.add("is-invalid");
        showToast("End date missing", "warning");
        return { ok: false };
      }
      const endIso = `${endDate}T${endTime || "00:00"}`;
      endMs = Date.parse(endIso);
      if (Number.isNaN(endMs)) {
        document.getElementById("endDate").classList.add("is-invalid");
        showToast("Invalid end date/time", "danger");
        return { ok: false };
      }
      if (endMs <= startMs) {
        document.getElementById("endDate").classList.add("is-invalid");
        showToast("End must be after start", "danger");
        return { ok: false };
      }
    }

    // lat/lng rule
    const lat = latRaw === "" ? null : parseCoord(latRaw);
    const lng = lngRaw === "" ? null : parseCoord(lngRaw);
    if ((lat === null) !== (lng === null)) {
      showToast(
        "If you provide coordinates, both latitude AND longitude must be filled.",
        "warning"
      );
      return { ok: false };
    }
    if (lat !== null) {
      if (
        !Number.isFinite(lat) ||
        !Number.isFinite(lng) ||
        lat < -90 ||
        lat > 90 ||
        lng < -180 ||
        lng > 180
      ) {
        showToast("Coordinates are invalid.", "danger");
        return { ok: false };
      }
    }

    const payload = {
      title,
      description,
      location,
      start_time: startMs,
      end_time: endMs,
      lat,
      lng,
      group_id: groupId,
    };
    return { ok: true, payload };
  }

  // submit: show modal then on confirm actually submit
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const result = validateAndBuild();
    if (!result.ok) return;

    // show confirmation modal
    if (confirmModal) {
      confirmModal.show();
      // attach one-time handler
      const handler = async () => {
        confirmModal.hide();
        confirmCreateBtn.removeEventListener("click", handler);
        await sendCreate(result.payload);
      };
      confirmCreateBtn.addEventListener("click", handler);
    } else {
      // fallback: use window.confirm
      if (!window.confirm("Are you sure you want to create this event?"))
        return;
      await sendCreate(result.payload);
    }
  });

  async function sendCreate(payload) {
    try {
      const res = await fetch("/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "server error" }));
        showToast(
          "Failed to create event: " + (err.error || "server error"),
          "danger"
        );
        return;
      }
      showToast("Event created.", "success");
      setTimeout(() => (window.location.href = "/events"), 900);
    } catch (err) {
      console.error(err);
      showToast("Network error while creating event.", "danger");
    }
  }
})();
